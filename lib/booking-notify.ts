import "server-only";

import {
  emailDetailsCard,
  emailParagraph,
  escapeHtml,
  sendAdminMail,
  sendBookingCancelled,
  sendBookingConfirmed,
  sendBookingDepositPaid,
  sendBookingReceived,
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
  const rows = [
    { label: "Guest", value: `${escapeHtml(input.name)} · ${escapeHtml(input.email)}` },
    { label: "Session", value: escapeHtml(input.serviceName) },
    { label: "When", value: escapeHtml(when) },
    { label: "Reason", value: escapeHtml(input.reason) },
    {
      label: "By",
      value: input.cancelledBy === "guest" ? "Guest (online)" : "Admin",
    },
  ];
  if (input.details) {
    rows.push({ label: "Note", value: escapeHtml(input.details) });
  }
  if (input.depositPaid && input.depositPaid > 0) {
    rows.push({
      label: "Deposit",
      value: `${escapeHtml(formatNaira(input.depositPaid))} — review refunds manually`,
    });
  }

  const result = await sendAdminMail({
    subject: `Booking cancelled: ${input.serviceName}`,
    headline: "Booking cancelled",
    body: `${emailParagraph("Someone cancelled a session.")}${emailDetailsCard(rows)}`,
    cta: { label: "Open bookings", href: `${site.url}/admin/appointments` },
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
  const result = await sendAdminMail({
    subject: `New booking: ${input.serviceName}`,
    headline: "New booking",
    body: `${emailParagraph(`<strong>${escapeHtml(input.name)}</strong> booked.`)}${emailDetailsCard([
      { label: "Session", value: escapeHtml(input.serviceName) },
      { label: "When", value: escapeHtml(formatLagosLong(input.startsAt)) },
      {
        label: "Deposit",
        value:
          input.deposit > 0 ? escapeHtml(formatNaira(input.deposit)) : "Not required",
      },
    ])}`,
    cta: { label: "Open bookings", href: `${site.url}/admin/appointments` },
  });
  logEmail("booking-admin-new", result, adminRecipients().join(", "));
  if (!result.ok) throw new Error(result.error);
}
