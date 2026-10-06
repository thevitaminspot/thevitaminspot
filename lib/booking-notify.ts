import "server-only";

import { after } from "next/server";
import {
  escapeHtml,
  sendBookingCancelled,
  sendBookingConfirmed,
  sendBookingDepositPaid,
  sendBookingReceived,
  sendMail,
  type SendMailResult,
} from "@/lib/email";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";

function logEmail(label: string, result: SendMailResult) {
  if (result.ok) {
    console.info(`[email:${label}] sent to customer`);
    return;
  }
  console.error(`[email:${label}]`, result.error);
}

function runAfter(label: string, task: () => Promise<SendMailResult>) {
  after(async () => {
    try {
      logEmail(label, await task());
    } catch (error) {
      console.error(
        `[email:${label}]`,
        error instanceof Error ? error.message : "Unexpected email error",
      );
    }
  });
}

export function notifyBookingReceived(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  deposit?: number;
  sessionPrice?: number;
}) {
  runAfter("booking-received", () => sendBookingReceived(input));
}

export function notifyBookingConfirmed(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositPaid?: number;
  depositDue?: number;
  sessionPrice?: number;
}) {
  runAfter("booking-confirmed", () => sendBookingConfirmed(input));
}

export function notifyBookingCancelled(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
}) {
  runAfter("booking-cancelled", () => sendBookingCancelled(input));
}

export function notifyBookingDepositPaid(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositAmount: number;
  sessionPrice?: number;
}) {
  runAfter("booking-deposit-paid", () => sendBookingDepositPaid(input));
}

export function notifyAdminNewBooking(input: {
  name: string;
  serviceName: string;
  startsAt: Date;
  deposit: number;
}) {
  runAfter("booking-admin-new", () =>
    sendMail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `New booking: ${input.serviceName}`,
      html: `<p>${escapeHtml(input.name)} booked <strong>${escapeHtml(input.serviceName)}</strong> for ${escapeHtml(input.startsAt.toLocaleString("en-NG"))}.</p><p>${input.deposit > 0 ? `Deposit: ${escapeHtml(formatNaira(input.deposit))}.` : "No deposit required."}</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
    }),
  );
}

export async function notifyBookingDepositPaidNow(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositAmount: number;
  sessionPrice?: number;
}) {
  try {
    logEmail("booking-deposit-paid", await sendBookingDepositPaid(input));
  } catch (error) {
    console.error(
      "[email:booking-deposit-paid]",
      error instanceof Error ? error.message : "Unexpected email error",
    );
  }
}
