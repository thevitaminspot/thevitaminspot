"use server";

import { headers } from "next/headers";
import { parseBookingDetails } from "@/lib/env";
import { listSlots } from "@/lib/availability";
import { findInfusion } from "@/lib/data";
import { tryPrisma } from "@/lib/db";
import { attachCustomer, getSessionProfile } from "@/lib/auth";
import { findLocalAppointment, updateLocalAppointment } from "@/lib/local-store";
import { cancelReasonLabel, isBookingCancelReason } from "@/lib/booking-cancel";
import {
  notifyAdminBookingCancelled,
  notifyAdminNewBooking,
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingReceived,
} from "@/lib/booking-notify";
import { hasPaystack } from "@/lib/env";
import { initializePaystack } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";
import { site, whatsappHref } from "@/lib/site";
import { createToken } from "@/lib/tokens";

export async function sendBookingNotifications(token: string) {
  const prisma = await tryPrisma();
  if (!prisma) return { error: "Bookings need the database." as const };

  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: { service: true },
  });
  if (!appointment) return { error: "Booking not found." as const };

  const manageUrl = `${site.url}/appointments/${token}`;

  await notifyBookingReceived({
    to: appointment.email,
    name: appointment.name,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt,
    manageUrl,
    deposit: appointment.service.deposit,
    sessionPrice: appointment.service.price,
  });

  await notifyAdminNewBooking({
    name: appointment.name,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt,
    deposit: appointment.service.deposit,
  });

  return { ok: true as const };
}

export async function fetchSlots(date: string, slug: string) {
  const drip = await findInfusion(slug);
  if (!drip) return [];
  return listSlots(date, drip.durationMin);
}

export async function createBooking(input: {
  slug: string;
  start: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  payDeposit?: boolean;
}) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`book:${ip}`).ok) {
    return { error: "Please wait a moment before booking again." };
  }

  const details = parseBookingDetails(input);
  if (!details.ok) return { error: details.error };

  const drip = await findInfusion(input.slug);
  if (!drip) return { error: "That drip isn’t available." };

  const startsAt = new Date(input.start);
  if (Number.isNaN(startsAt.getTime())) return { error: "Choose a valid time." };
  const endsAt = new Date(startsAt.getTime() + drip.durationMin * 60_000);

  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Bookings need the Neon database. Add DATABASE_URL and load the catalogue in admin." };
  }

  const clash = await prisma.appointment.findFirst({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (clash) return { error: "That hour has just been taken. Please choose another." };

  const user = await attachCustomer(await getSessionProfile());
  const token = createToken();

  const appointment = await prisma.appointment.create({
    data: {
      accessToken: token,
      startsAt,
      endsAt,
      name: details.data.name,
      email: details.data.email,
      phone: details.data.phone,
      notes: details.data.notes,
      status: "PENDING",
      service: {
        connectOrCreate: {
          where: { slug: drip.slug },
          create: {
            name: drip.name,
            slug: drip.slug,
            tagline: drip.tagline,
            description: drip.description,
            benefits: drip.benefits,
            ingredients: drip.ingredients,
            durationMin: drip.durationMin,
            price: drip.price,
            deposit: drip.deposit,
            featured: drip.featured,
            image: drip.image,
          },
        },
      },
      user,
    },
  });

  const manageUrl = `${site.url}/appointments/${token}`;

  await notifyBookingReceived({
    to: details.data.email,
    name: details.data.name,
    serviceName: drip.name,
    startsAt,
    manageUrl,
    deposit: drip.deposit,
    sessionPrice: drip.price,
  }).catch((error) => {
    console.error("[booking:create] customer email failed", error);
  });

  await notifyAdminNewBooking({
    name: details.data.name,
    serviceName: drip.name,
    startsAt,
    deposit: drip.deposit,
  }).catch((error) => {
    console.error("[booking:create] admin email failed", error);
  });

  if (input.payDeposit) {
    if (!hasPaystack()) {
      return { error: "Online payments are not configured yet. Book without a deposit or try again later." };
    }
    if (drip.deposit <= 0) {
      return { error: "This session does not have an online deposit. Use Confirm booking instead." };
    }

    try {
      const reference = `apt_${appointment.id}`;
      const payment = await initializePaystack({
        email: details.data.email,
        amount: drip.deposit,
        reference,
        callbackUrl: manageUrl,
        metadata: { purpose: "APPOINTMENT_DEPOSIT", appointmentId: appointment.id },
      });
      await prisma.payment.create({
        data: {
          purpose: "APPOINTMENT_DEPOSIT",
          amount: drip.deposit,
          paystackReference: reference,
          paystackAccessCode: payment.access_code,
          appointmentId: appointment.id,
        },
      });
      return {
        token,
        whatsapp: whatsappHref(
          `I have booked ${drip.name} at The Vitamin Spot for ${startsAt.toLocaleString("en-NG")}.`,
        ),
        checkoutUrl: payment.authorization_url,
      };
    } catch (error) {
      await prisma.appointment.delete({ where: { id: appointment.id } }).catch(() => undefined);
      const message =
        error instanceof Error ? error.message : "Could not start the deposit payment.";
      return { error: message };
    }
  }

  return {
    token,
    whatsapp: whatsappHref(
      `I have booked ${drip.name} at The Vitamin Spot for ${startsAt.toLocaleString("en-NG")}.`,
    ),
  };
}

export async function resumeAppointmentDeposit(token: string) {
  const prisma = await tryPrisma();
  if (!prisma) return { error: "Bookings need the database." };
  if (!hasPaystack()) return { error: "Online payments are not configured yet." };

  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: { service: true, payment: true },
  });
  if (!appointment) return { error: "Booking not found." };
  if (appointment.status === "CONFIRMED") return { error: "This booking is already confirmed." };
  if (appointment.service.deposit <= 0) {
    return { error: "This session does not require a deposit." };
  }
  if (appointment.payment?.status === "PAID") {
    return { error: "Deposit already paid." };
  }

  const reference = appointment.payment?.paystackReference ?? `apt_${appointment.id}`;
  const manageUrl = `${site.url}/appointments/${token}`;

  try {
    const payment = await initializePaystack({
      email: appointment.email,
      amount: appointment.service.deposit,
      reference,
      callbackUrl: manageUrl,
      metadata: { purpose: "APPOINTMENT_DEPOSIT", appointmentId: appointment.id },
    });

    if (appointment.payment) {
      await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: {
          amount: appointment.service.deposit,
          paystackAccessCode: payment.access_code,
          status: "PENDING",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          purpose: "APPOINTMENT_DEPOSIT",
          amount: appointment.service.deposit,
          paystackReference: reference,
          paystackAccessCode: payment.access_code,
          appointmentId: appointment.id,
        },
      });
    }

    return { checkoutUrl: payment.authorization_url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not start the deposit payment.",
    };
  }
}

function buildCancellationNote(reason: string, details?: string, existingNotes?: string | null) {
  const lines = [
    `[Cancelled by guest ${new Date().toISOString()}]`,
    `Reason: ${cancelReasonLabel(reason)}`,
  ];
  if (details?.trim()) lines.push(`Details: ${details.trim()}`);
  if (existingNotes?.trim()) {
    lines.push("", "---", existingNotes.trim());
  }
  return lines.join("\n");
}

export async function cancelAppointment(
  token: string,
  input: { reason: string; details?: string; acknowledged: boolean },
) {
  if (!input.acknowledged) {
    return { error: "Please confirm you understand the cancellation policy." };
  }
  if (!isBookingCancelReason(input.reason)) {
    return { error: "Please choose why you are cancelling." };
  }
  if (input.reason === "other" && !input.details?.trim()) {
    return { error: "Please tell us a little more when choosing “Something else”." };
  }

  const prisma = await tryPrisma();
  if (!prisma) {
    const appointment = await findLocalAppointment(token);
    if (!appointment) return { error: "Appointment not found." };
    await updateLocalAppointment(appointment.id, { status: "CANCELLED" });
    return { ok: true as const };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: { service: true, payment: true },
  });
  if (!appointment) return { error: "Appointment not found." };
  if (appointment.status === "CANCELLED") {
    return { error: "This booking is already cancelled." };
  }
  if (appointment.status === "COMPLETED") {
    return { error: "This session has already taken place and cannot be cancelled online." };
  }

  const manageUrl = `${site.url}/appointments/${token}`;
  const depositPaid = appointment.payment?.status === "PAID" ? appointment.payment.amount : undefined;
  const reasonLabel = cancelReasonLabel(input.reason);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CANCELLED",
      notes: buildCancellationNote(input.reason, input.details, appointment.notes),
    },
  });

  await notifyBookingCancelled({
    to: appointment.email,
    name: appointment.name,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt,
    manageUrl,
    reason: reasonLabel,
    depositPaid,
  }).catch((error) => {
    console.error("[booking:cancel] customer email failed", error);
  });

  await notifyAdminBookingCancelled({
    name: appointment.name,
    email: appointment.email,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt,
    reason: reasonLabel,
    details: input.details?.trim(),
    depositPaid,
    cancelledBy: "guest",
  }).catch((error) => {
    console.error("[booking:cancel] admin email failed", error);
  });

  return { ok: true as const };
}

export async function updateAppointment(token: string, start: string) {
  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Choose a new time from the booking page." };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: { service: true, payment: true },
  });
  if (!appointment) return { error: "Appointment not found." };
  if (appointment.status === "CANCELLED") {
    return { error: "This booking was cancelled. Book a new session instead." };
  }

  if (!start) return { error: "Choose a new time." };
  const startsAt = new Date(start);
  const endsAt = new Date(
    startsAt.getTime() + appointment.service.durationMin * 60_000,
  );
  const clash = await prisma.appointment.findFirst({
    where: {
      id: { not: appointment.id },
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (clash) return { error: "That hour is taken." };

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startsAt, endsAt, status: "CONFIRMED" },
  });

  const depositPaid =
    appointment.payment?.status === "PAID" ? appointment.payment.amount : undefined;
  const depositDue =
    appointment.service.deposit > 0 && appointment.payment?.status !== "PAID"
      ? appointment.service.deposit
      : undefined;

  await notifyBookingConfirmed({
    to: appointment.email,
    name: appointment.name,
    serviceName: appointment.service.name,
    startsAt,
    manageUrl: `${site.url}/appointments/${token}`,
    depositPaid,
    depositDue,
    sessionPrice: appointment.service.price,
  }).catch(() => undefined);

  return { ok: true };
}
