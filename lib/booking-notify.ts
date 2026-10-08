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
import { adminRecipients } from "@/lib/admin-access";
import { formatLagosLong } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";

function logEmail(label: string, result: SendMailResult, to?: string) {
  if (result.ok) {
    console.info(`[email:${label}] sent`, to ?? "");
    return result;
  }
  console.error(`[email:${label}]`, result.error, to ?? "");
  return result;
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
  const result = await sendBookingReceived(input);
  logEmail("booking-received", result, input.to);
  if (!result.ok) throw new Error(result.error);
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
  const result = await sendBookingConfirmed(input);
  logEmail("booking-confirmed", result, input.to);
  if (!result.ok) throw new Error(result.error);
}

export async function notifyBookingCancelled(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  reason?: string;
  depositPaid?: number;
}) {
  const result = await sendBookingCancelled(input);
  logEmail("booking-cancelled", result, input.to);
  if (!result.ok) throw new Error(result.error);
}

export async function notifyAdminBookingCancelled(input: {
  name: string;
  email: string;
  serviceName: string;
  startsAt: Date;
  reason: string;
  details?: string;
  depositPaid?: number;
  cancelledBy: "guest" | "admin";
}) {
  const when = formatLagosLong(input.startsAt);
  const depositLine =
    input.depositPaid && input.depositPaid > 0
      ? `<p><strong>Deposit paid:</strong> ${escapeHtml(formatNaira(input.depositPaid))}. Review refund requests manually if needed.</p>`
      : "";
  const detailsLine = input.details
    ? `<p><strong>Guest note:</strong> ${escapeHtml(input.details)}</p>`
    : "";
  const result = await sendMail({
    to: adminRecipients(),
    subject: `Booking cancelled: ${input.serviceName}`,
    html: `<p><strong>${escapeHtml(input.name)}</strong> (${escapeHtml(input.email)}) cancelled <strong>${escapeHtml(input.serviceName)}</strong> on ${escapeHtml(when)}.</p><p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p><p><strong>Cancelled by:</strong> ${input.cancelledBy === "guest" ? "Guest (online)" : "Admin"}</p>${detailsLine}${depositLine}<p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
  });
  logEmail("booking-admin-cancelled", result, adminRecipients().join(", "));
  if (!result.ok) throw new Error(result.error);
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
  const result = await sendBookingDepositPaid(input);
  logEmail("booking-deposit-paid", result, input.to);
  if (!result.ok) throw new Error(result.error);
}

export async function notifyAdminNewBooking(input: {
  name: string;
  serviceName: string;
  startsAt: Date;
  deposit: number;
}) {
  const result = await sendMail({
    to: adminRecipients(),
    subject: `New booking: ${input.serviceName}`,
    html: `<p>${escapeHtml(input.name)} booked <strong>${escapeHtml(input.serviceName)}</strong> for ${escapeHtml(formatLagosLong(input.startsAt))}.</p><p>${input.deposit > 0 ? `Deposit: ${escapeHtml(formatNaira(input.deposit))}.` : "No deposit required."}</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
  });
  logEmail("booking-admin-new", result, adminRecipients().join(", "));
  if (!result.ok) throw new Error(result.error);
}
