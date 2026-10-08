import "server-only";
import { Resend } from "resend";
import { formatLagosLong } from "@/lib/datetime";
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
  to: string | string[];
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

type FulfillmentMethod = "DELIVERY" | "PICKUP";

const brand = {
  deep: "#0b2c21",
  cream: "#faf7f2",
  sage: "#7a9e8e",
  tint: "#f0ebe3",
};

function emailLayout(input: {
  eyebrow: string;
  headline: string;
  body: string;
  cta?: { label: string; href: string };
  footnote?: string;
}) {
  const cta = input.cta
    ? `<p style="margin:28px 0 0;">
        <a href="${escapeHtml(input.cta.href)}" style="display:inline-block;padding:14px 28px;background:${brand.deep};color:${brand.cream};text-decoration:none;border-radius:10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">
          ${escapeHtml(input.cta.label)}
        </a>
      </p>`
    : "";

  const footnote = input.footnote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${brand.deep}99;">${input.footnote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${brand.tint};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.tint};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${brand.deep}14;overflow:hidden;">
          <tr>
            <td style="background:${brand.deep};padding:28px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.22em;color:${brand.sage};text-transform:uppercase;">${escapeHtml(site.name)}</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;font-weight:400;color:${brand.cream};">${escapeHtml(input.headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;color:${brand.sage};text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
              <div style="font-size:15px;line-height:1.7;color:${brand.deep};">${input.body}</div>
              ${footnote}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${brand.tint};border-top:1px solid ${brand.deep}10;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${brand.deep}88;">
                Questions? Reply to this email or WhatsApp us at ${escapeHtml(site.phone)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function orderStatusContent(
  status: string,
  fulfillment: FulfillmentMethod,
): { subject: string; headline: string; body: string; footnote?: string } {
  const pickup = fulfillment === "PICKUP";
  const shop = site.address.label;

  switch (status) {
    case "PAID":
      return {
        subject: pickup
          ? "Payment received — we're getting your order ready"
          : "Payment received — we're preparing your order",
        headline: pickup ? "Ready soon for pickup" : "We're on it",
        body: pickup
          ? `<p style="margin:0 0 12px;">Thanks for your order. We've received your payment and we're preparing everything for pickup at our shop.</p>
             <p style="margin:0;">We'll let you know the moment it's ready to collect.</p>`
          : `<p style="margin:0 0 12px;">Thanks for your order. Payment is confirmed and we're preparing your items now.</p>
             <p style="margin:0;">You'll hear from us again when your order ships.</p>`,
      };
    case "PACKED":
      return pickup
        ? {
            subject: "Your order is ready for pickup",
            headline: "Ready for pickup",
            body: `<p style="margin:0 0 12px;">Good news — your order is packed and waiting for you.</p>
                   <p style="margin:0;">Pop in whenever suits you. We're at <strong>${escapeHtml(shop)}</strong>.</p>`,
            footnote: `Bring your order number. If you need directions, reply and we'll help.`,
          }
        : {
            subject: "Your order is packed",
            headline: "Packed & ready",
            body: `<p style="margin:0 0 12px;">Your order is packed and queued for dispatch.</p>
                   <p style="margin:0;">We'll notify you once it's on the way.</p>`,
          };
    case "OUT_FOR_DELIVERY":
      return {
        subject: "Your order is on the way",
        headline: "Out for delivery",
        body: `<p style="margin:0 0 12px;">Your order has left the shop and is heading your way.</p>
               <p style="margin:0;">Keep your phone handy in case our courier needs to reach you.</p>`,
      };
    case "DELIVERED":
      return pickup
        ? {
            subject: "Thanks for picking up",
            headline: "Enjoy your order",
            body: `<p style="margin:0 0 12px;">Thanks for collecting your order — we hope you love everything.</p>
                   <p style="margin:0;">Need anything else? We're always here.</p>`,
          }
        : {
            subject: "Your order has been delivered",
            headline: "Delivered",
            body: `<p style="margin:0 0 12px;">Your order has been delivered. We hope everything arrived just right.</p>
                   <p style="margin:0;">If anything looks off, reply and we'll sort it out.</p>`,
          };
    case "CANCELLED":
      return {
        subject: "Your order was cancelled",
        headline: "Order cancelled",
        body: `<p style="margin:0;">Your order has been cancelled. If this wasn't expected or you'd like to place a new one, just reply to this email.</p>`,
      };
    default:
      return {
        subject: "Order update",
        headline: "Order update",
        body: `<p style="margin:0;">There's an update on your order. Check the link below for the latest status.</p>`,
      };
  }
}

export async function sendOrderUpdate(input: {
  to: string;
  name: string;
  orderNumber: string;
  status: string;
  total: number;
  trackUrl: string;
  fulfillment?: FulfillmentMethod;
}) {
  const fulfillment = input.fulfillment ?? "DELIVERY";
  const copy = orderStatusContent(input.status, fulfillment);
  const totalLine = `<p style="margin:16px 0 0;padding:14px 16px;background:${brand.tint};border-radius:10px;font-size:14px;color:${brand.deep};"><strong>Order ${escapeHtml(input.orderNumber)}</strong> · ${escapeHtml(formatNaira(input.total))}</p>`;

  return sendMail({
    to: input.to,
    subject: `${copy.subject} · ${input.orderNumber}`,
    html: emailLayout({
      eyebrow: `Dear ${input.name}`,
      headline: copy.headline,
      body: `${copy.body}${totalLine}`,
      footnote: copy.footnote,
      cta: { label: "View your order", href: input.trackUrl },
    }),
  });
}

function formatBookingWhen(startsAt: Date) {
  return formatLagosLong(startsAt);
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
