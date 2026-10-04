"use server";

import { headers } from "next/headers";
import { bookingDetailsSchema } from "@/lib/env";
import { listSlots } from "@/lib/availability";
import { findInfusion } from "@/lib/data";
import { tryPrisma } from "@/lib/db";
import { findLocalAppointment, readLocalAppointments, saveLocalAppointment, updateLocalAppointment } from "@/lib/local-store";
import { sendMail } from "@/lib/email";
import { hasPaystack } from "@/lib/env";
import { initializePaystack } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";
import { site, whatsappHref } from "@/lib/site";
import { createToken } from "@/lib/tokens";
import { getSessionUser } from "@/lib/supabase/server";

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

  const details = bookingDetailsSchema.safeParse(input);
  if (!details.success) return { error: "Please complete your details." };

  const drip = await findInfusion(input.slug);
  if (!drip) return { error: "That drip isn’t available." };

  const startsAt = new Date(input.start);
  if (Number.isNaN(startsAt.getTime())) return { error: "Choose a valid time." };
  const endsAt = new Date(startsAt.getTime() + drip.durationMin * 60_000);

  const prisma = await tryPrisma();
  if (!prisma) {
    const taken = await readLocalAppointments();
    const clash = taken.some(
      (row) =>
        (row.status === "PENDING" || row.status === "CONFIRMED") &&
        startsAt < new Date(row.endsAt) &&
        endsAt > new Date(row.startsAt),
    );
    if (clash) return { error: "That hour has just been taken. Please choose another." };
    const token = createToken();
    await saveLocalAppointment({
      id: `apt-${token.slice(0, 8)}`,
      accessToken: token,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      name: details.data.name,
      email: details.data.email,
      phone: details.data.phone,
      notes: details.data.notes ?? "",
      status: "PENDING",
      serviceName: drip.name,
      serviceSlug: drip.slug,
    });
    return {
      token,
      whatsapp: whatsappHref(
        `I have booked ${drip.name} at The Vitamin Spot for ${startsAt.toLocaleString("en-NG")}.`,
      ),
    };
  }

  const clash = await prisma.appointment.findFirst({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (clash) return { error: "That hour has just been taken. Please choose another." };

  const user = await getSessionUser();
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
      ...(user?.email
        ? {
            user: {
              connectOrCreate: {
                where: { email: user.email },
                create: {
                  email: user.email,
                  name: user.user_metadata?.name,
                },
              },
            },
          }
        : {}),
    },
  });

  const manageUrl = `${site.url}/appointments/${token}`;
  await sendMail({
    to: details.data.email,
    subject: `Your booking at ${site.name}`,
    html: `<p>Dear ${details.data.name},</p><p>Your ${drip.name} is held for ${startsAt.toLocaleString("en-NG")}.</p><p><a href="${manageUrl}">View or change your appointment</a></p>`,
  });

  if (input.payDeposit && drip.deposit > 0 && hasPaystack()) {
    const reference = `apt_${appointment.id}`;
    const payment = await initializePaystack({
      email: details.data.email,
      amount: drip.deposit,
      reference,
      callbackUrl: `${site.url}/appointments/${token}`,
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
  }

  return {
    token,
    whatsapp: whatsappHref(
      `I have booked ${drip.name} at The Vitamin Spot for ${startsAt.toLocaleString("en-NG")}.`,
    ),
  };
}

export async function updateAppointment(
  token: string,
  action: "cancel" | "reschedule",
  start?: string,
) {
  const prisma = await tryPrisma();
  if (!prisma) {
    const appointment = await findLocalAppointment(token);
    if (!appointment) return { error: "Appointment not found." };
    if (action === "cancel") {
      await updateLocalAppointment(appointment.id, { status: "CANCELLED" });
      return { ok: true };
    }
    return { error: "Choose a new time from the booking page." };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: { service: true },
  });
  if (!appointment) return { error: "Appointment not found." };

  if (action === "cancel") {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
    });
    return { ok: true };
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
  return { ok: true };
}
