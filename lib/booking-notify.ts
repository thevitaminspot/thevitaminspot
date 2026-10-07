import "server-only";

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
    console.info(`[email:${label}] sent`);
    return;
  }
  console.error(`[email:${label}]`, result.error);
}

export async function notifyBookingReceived(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  deposit?: number;
  sessionPrice?: number;
}) {
  logEmail("booking-received", await sendBookingReceived(input));
}

export async function notifyBookingConfirmed(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositPaid?: number;
  depositDue?: number;
  sessionPrice?: number;
}) {
  logEmail("booking-confirmed", await sendBookingConfirmed(input));
}

export async function notifyBookingCancelled(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
}) {
  logEmail("booking-cancelled", await sendBookingCancelled(input));
}

export async function notifyBookingDepositPaid(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositAmount: number;
  sessionPrice?: number;
}) {
  logEmail("booking-deposit-paid", await sendBookingDepositPaid(input));
}

export async function notifyAdminNewBooking(input: {
  name: string;
  serviceName: string;
  startsAt: Date;
  deposit: number;
}) {
  logEmail(
    "booking-admin-new",
    await sendMail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `New booking: ${input.serviceName}`,
      html: `<p>${escapeHtml(input.name)} booked <strong>${escapeHtml(input.serviceName)}</strong> for ${escapeHtml(input.startsAt.toLocaleString("en-NG"))}.</p><p>${input.deposit > 0 ? `Deposit: ${escapeHtml(formatNaira(input.deposit))}.` : "No deposit required."}</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
    }),
  );
}
