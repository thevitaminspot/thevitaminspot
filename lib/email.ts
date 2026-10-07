import "server-only";
import { Resend } from "resend";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";

const verifiedFromDomain = "thevitaminspotltd.com";
const defaultFrom = `${site.name} <hello@${verifiedFromDomain}>`;

let resendClient: Resend | null = null;

function extractFromEmail(from: string) {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

function primaryFrom() {
  const configured = process.env.RESEND_FROM_EMAIL ?? defaultFrom;
  const email = extractFromEmail(configured);
  if (!email.endsWith(`@${verifiedFromDomain}`)) {
    console.warn(
      `[email:from] RESEND_FROM_EMAIL must use @${verifiedFromDomain}, not ${email}. Using ${defaultFrom}.`,
    );
    return defaultFrom;
  }
  return configured;
}

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resendClient ??= new Resend(key);
  return resendClient;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeEmailSubject(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

export function canSendEmail() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function emailConfigStatus() {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = primaryFrom();
  return {
    configured: Boolean(key),
    from,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };
}

export type SendMailResult =
  | { ok: true; id?: string; provider: "resend"; from: string }
  | { ok: false; error: string };

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendMailResult> {
  const client = getResendClient();
  if (!client) {
    console.error(
      "[email:missing-key] RESEND_API_KEY is not set on this deployment.",
      input.subject,
      input.to,
      process.env.VERCEL_ENV ?? "local",
    );
    return { ok: false as const, error: "Resend is not configured." };
  }

  const from = primaryFrom();
  const { data, error } = await client.emails.send({
    from,
    to: input.to,
    subject: sanitizeEmailSubject(input.subject),
    html: input.html,
    replyTo: input.replyTo ?? site.email,
  });

  if (!error) {
    console.info("[email:sent]", input.subject, input.to, data?.id ?? "");
    return { ok: true as const, id: data?.id, provider: "resend" as const, from };
  }

  const message = error.message || "Unknown Resend error";
  console.error("[email:not-sent]", message, "from", from, "to", input.to);
  return { ok: false as const, error: message };
}

const orderStatusCopy: Record<string, string> = {
  PENDING: "is waiting for payment",
  PAID: "is paid and being prepared",
  PACKED: "is packed",
  OUT_FOR_DELIVERY: "is on the way",
  DELIVERED: "has been delivered",
  CANCELLED: "has been cancelled",
};

export async function sendOrderUpdate(input: {
  to: string;
  name: string;
  orderNumber: string;
  status: string;
  total: number;
  trackUrl: string;
}) {
  const line = orderStatusCopy[input.status] ?? "has been updated";
  return sendMail({
    to: input.to,
    subject: `Order ${input.orderNumber} ${line}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>Order ${escapeHtml(input.orderNumber)} ${escapeHtml(line)}. Total ${escapeHtml(formatNaira(input.total))}.</p><p><a href="${escapeHtml(input.trackUrl)}">View the order</a></p>`,
  });
}

function formatBookingWhen(startsAt: Date) {
  return startsAt.toLocaleString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function sendBookingReceived(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  deposit?: number;
  sessionPrice?: number;
}) {
  const when = formatBookingWhen(input.startsAt);
  const depositDue =
    input.deposit && input.deposit > 0
      ? `<p><strong>Deposit:</strong> ${escapeHtml(formatNaira(input.deposit))}${
          input.sessionPrice && input.sessionPrice > input.deposit
            ? ` (${escapeHtml(formatNaira(input.sessionPrice - input.deposit))} due at your visit)`
            : ""
        }. <a href="${escapeHtml(input.manageUrl)}">Pay your deposit online</a> to secure your slot.</p>`
      : `<p>We’ll confirm your appointment shortly.</p>`;
  return sendMail({
    to: input.to,
    subject: `We received your booking - ${input.serviceName}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>Thanks for booking <strong>${escapeHtml(input.serviceName)}</strong> for ${escapeHtml(when)}.</p>${depositDue}<p>You can view or change your booking here:</p><p><a href="${escapeHtml(input.manageUrl)}">Manage your booking</a></p>`,
  });
}

export async function sendBookingDepositPaid(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  depositAmount: number;
  sessionPrice?: number;
  location?: string;
}) {
  const when = formatBookingWhen(input.startsAt);
  const location = input.location ?? site.address.label;
  const balance =
    input.sessionPrice && input.sessionPrice > input.depositAmount
      ? `<p>The remaining balance of ${escapeHtml(formatNaira(input.sessionPrice - input.depositAmount))} is payable at your visit.</p>`
      : "";
  return sendMail({
    to: input.to,
    subject: `Deposit received - ${input.serviceName}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>We’ve received your deposit of <strong>${escapeHtml(formatNaira(input.depositAmount))}</strong> for <strong>${escapeHtml(input.serviceName)}</strong>.</p><p><strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(location)}</p><p>Your booking is confirmed.</p>${balance}<p>Please arrive a few minutes early. Tell us if you’re pregnant, on medication, or have allergies.</p><p><a href="${escapeHtml(input.manageUrl)}">View your booking</a></p><p>Questions? Reply to this email or WhatsApp us at ${escapeHtml(site.phone)}.</p>`,
  });
}

export async function sendBookingConfirmed(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  location?: string;
  depositPaid?: number;
  depositDue?: number;
  sessionPrice?: number;
}) {
  const when = formatBookingWhen(input.startsAt);
  const location = input.location ?? site.address.label;
  const depositLine = input.depositPaid
    ? `<p><strong>Deposit paid:</strong> ${escapeHtml(formatNaira(input.depositPaid))}${
        input.sessionPrice && input.sessionPrice > input.depositPaid
          ? ` · ${escapeHtml(formatNaira(input.sessionPrice - input.depositPaid))} due at visit`
          : ""
      }</p>`
    : input.depositDue
      ? `<p><strong>Deposit due:</strong> ${escapeHtml(formatNaira(input.depositDue))} — <a href="${escapeHtml(input.manageUrl)}">pay online</a> or at the clinic.</p>`
      : "";
  return sendMail({
    to: input.to,
    subject: `Booking confirmed - ${input.serviceName}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>Your <strong>${escapeHtml(input.serviceName)}</strong> session is confirmed.</p><p><strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(location)}</p>${depositLine}<p>Please arrive a few minutes early. Tell us if you’re pregnant, on medication, or have allergies.</p><p><a href="${escapeHtml(input.manageUrl)}">View your booking</a></p><p>Questions? Reply to this email or WhatsApp us at ${escapeHtml(site.phone)}.</p>`,
  });
}

export async function sendBookingCancelled(input: {
  to: string;
  name: string;
  serviceName: string;
  startsAt: Date;
  manageUrl: string;
  reason?: string;
  depositPaid?: number;
}) {
  const when = formatBookingWhen(input.startsAt);
  const reasonLine = input.reason
    ? `<p><strong>Reason recorded:</strong> ${escapeHtml(input.reason)}</p>`
    : "";
  const depositLine =
    input.depositPaid && input.depositPaid > 0
      ? `<p>We received a deposit of ${escapeHtml(formatNaira(input.depositPaid))}. Refunds are reviewed case by case — reply to this email or WhatsApp us if you need help.</p>`
      : "";
  return sendMail({
    to: input.to,
    subject: `Booking cancelled - ${input.serviceName}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>Your <strong>${escapeHtml(input.serviceName)}</strong> session on ${escapeHtml(when)} has been cancelled as requested.</p>${reasonLine}${depositLine}<p>Your time slot is now open for other guests. If this was a mistake, reply to this email or <a href="${escapeHtml(`${site.url}/book`)}">book again</a>.</p><p><a href="${escapeHtml(input.manageUrl)}">View the booking</a></p>`,
  });
}
