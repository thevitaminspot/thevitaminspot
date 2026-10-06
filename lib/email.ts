import "server-only";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";

const resendApiUrl = "https://api.resend.com/emails";

type ResendError = {
  message?: string;
  error?: { message?: string };
};

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

function adminEmail() {
  return (process.env.ADMIN_EMAIL ?? site.email).toLowerCase();
}

const verifiedFromDomain = "thevitaminspotltd.com";
const defaultFrom = `${site.name} <hello@${verifiedFromDomain}>`;

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

function resendErrorMessage(error: ResendError | null | undefined) {
  if (!error) return "Unknown Resend error";
  if (typeof error.message === "string" && error.message) return error.message;
  if (typeof error.error?.message === "string" && error.error.message) return error.error.message;
  return "Unknown Resend error";
}

function isDomainError(message: string) {
  return /not verified|verify your domain/i.test(message);
}

function isTestSenderLimit(message: string) {
  return /only send testing emails to your own email/i.test(message);
}

export function canSendEmail() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function deliver(
  input: { to: string; subject: string; html: string; replyTo?: string },
  from: string,
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { data: null, error: { message: "Resend is not configured." } satisfies ResendError };
  }

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: sanitizeEmailSubject(input.subject),
      html: input.html,
      reply_to: input.replyTo ?? site.email,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | { id?: string }
    | ResendError;

  if (!response.ok) {
    return { data: null, error: payload as ResendError };
  }

  return { data: payload as { id?: string }, error: null };
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email:skipped] Set RESEND_API_KEY in .env.", input.subject, input.to);
    return { ok: false as const, error: "Resend is not configured." };
  }

  const from = primaryFrom();
  const { data, error } = await deliver(input, from);
  if (!error) {
    return { ok: true as const, id: data?.id, provider: "resend" as const, from };
  }

  const lastError = resendErrorMessage(error);
  if (isDomainError(lastError) || isTestSenderLimit(lastError)) {
    console.error("[email:domain]", lastError, "from", from, "to", input.to);
  } else {
    console.error("[email:not-sent]", lastError, "from", from, "to", input.to);
  }

  return { ok: false as const, error: lastError };
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
    subject: `We received your booking — ${input.serviceName}`,
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
    subject: `Deposit received — ${input.serviceName}`,
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
    subject: `Booking confirmed — ${input.serviceName}`,
    html: `<p>Dear ${escapeHtml(input.name)},</p><p>Your <strong>${escapeHtml(input.serviceName)}</strong> session is confirmed.</p><p><strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(location)}</p>${depositLine}<p>Please arrive a few minutes early. Tell us if you’re pregnant, on medication, or have allergies.</p><p><a href="${escapeHtml(input.manageUrl)}">View your booking</a></p><p>Questions? Reply to this email or WhatsApp us at ${escapeHtml(site.phone)}.</p>`,
  });
}
