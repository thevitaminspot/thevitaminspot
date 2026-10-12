import "server-only";
import { Resend } from "resend";
import { adminRecipients } from "@/lib/admin-access";
import { brand as siteBrand } from "@/lib/brand";
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

function htmlToPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  text?: string;
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
  const text = input.text ?? htmlToPlainText(input.html);
  const { data, error } = await client.emails.send({
    from,
    to: input.to,
    subject: sanitizeEmailSubject(input.subject),
    html: input.html,
    text,
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

export type EmailCta = { label: string; href: string };

/** Public origin for images in email (must work from inboxes, not localhost). */
const EMAIL_ASSET_ORIGIN = "https://www.thevitaminspotltd.com";

const palette = {
  ...siteBrand.colors,
  champagne: "#e6d7b8",
  white: "#ffffff",
  paper: "#fbf8f2",
  line: "#e4ddd0",
  muted: "#5c6a63",
  amber: "#b45309",
};

const fontDisplay = "Georgia,'Times New Roman',Times,serif";
const fontSans =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function emailPreheader(text: string) {
  const pad = "&nbsp;&zwnj;&nbsp;".repeat(24);
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;font-size:1px;line-height:1px;">${escapeHtml(text)}${pad}</div>`;
}

export function emailLink(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="color:${palette.deep};font-weight:500;text-decoration:underline;text-decoration-color:${palette.primary};">${escapeHtml(label)}</a>`;
}

export function emailParagraph(content: string, options?: { last?: boolean }) {
  const margin = options?.last ? "0" : "0 0 14px";
  return `<p style="margin:${margin};font-family:${fontSans};font-size:15px;line-height:1.7;color:${palette.ink};">${content}</p>`;
}

export function emailDetailsCard(rows: { label: string; value: string }[]) {
  const rowsHtml = rows
    .map(
      (row, index) => `<tr>
      <td style="padding:${index === 0 ? "0" : "11px"} 16px 11px 0;font-family:${fontSans};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${palette.muted};vertical-align:top;width:112px;border-top:${index === 0 ? "0" : `1px solid ${palette.line}`};">${escapeHtml(row.label)}</td>
      <td style="padding:${index === 0 ? "0" : "11px"} 0 11px;font-family:${fontSans};font-size:15px;line-height:1.5;color:${palette.deep};border-top:${index === 0 ? "0" : `1px solid ${palette.line}`};">${row.value}</td>
    </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;border-top:1px solid ${palette.deep};border-bottom:1px solid ${palette.deep};">
    <tr>
      <td style="padding:16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td>
    </tr>
  </table>`;
}

export function emailCallout(content: string, tone: "neutral" | "accent" | "alert" = "neutral") {
  const border =
    tone === "alert" ? palette.amber : tone === "accent" ? palette.primary : palette.deep;
  return `<p style="margin:18px 0 0;padding:10px 0 10px 14px;border-left:2px solid ${border};font-family:${fontSans};font-size:14px;line-height:1.65;color:${palette.ink};">${content}</p>`;
}

export function emailQuote(content: string) {
  return `<p style="margin:0 0 16px;padding:14px 0 14px 16px;border-left:2px solid ${palette.primary};font-family:${fontDisplay};font-size:16px;line-height:1.7;color:${palette.ink};white-space:pre-wrap;">${escapeHtml(content)}</p>`;
}

function emailButton(cta: EmailCta) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background:${palette.deep};">
        <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:13px 26px;font-family:${fontSans};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${palette.cream};text-decoration:none;">${escapeHtml(cta.label)}</a>
      </td>
    </tr>
  </table>`;
}

function emailLetterhead(variant: "customer" | "admin") {
  const markUrl = `${EMAIL_ASSET_ORIGIN}${siteBrand.mark.src}`;
  const meta =
    variant === "admin"
      ? "Internal correspondence"
      : "Abuja &nbsp;·&nbsp; Shop &amp; IV";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;padding:0 12px 0 0;width:44px;">
        <a href="${escapeHtml(EMAIL_ASSET_ORIGIN)}" style="text-decoration:none;">
          <img src="${markUrl}" width="36" height="48" alt="${escapeHtml(siteBrand.mark.alt)}" style="display:block;width:36px;height:auto;border:0;outline:none;" />
        </a>
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-family:${fontDisplay};font-size:17px;line-height:1.2;color:${palette.deep};">${escapeHtml(siteBrand.name)}</p>
        <p style="margin:4px 0 0;font-family:${fontSans};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};">${meta}</p>
      </td>
    </tr>
  </table>`;
}

function emailRule() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
    <tr><td style="height:1px;background:${palette.line};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function emailShell(input: {
  greeting?: string;
  headline: string;
  preheader: string;
  body: string;
  footnote?: string;
  cta?: EmailCta;
  footer: string;
  variant: "customer" | "admin";
  alertStripe?: boolean;
}) {
  const footnote = input.footnote
    ? `<p style="margin:16px 0 0;font-family:${fontSans};font-size:13px;line-height:1.6;color:${palette.muted};">${input.footnote}</p>`
    : "";
  const cta = input.cta ? emailButton(input.cta) : "";
  const topBar = input.alertStripe ? palette.amber : palette.deep;
  const greeting = input.greeting
    ? `<p style="margin:0 0 18px;font-family:${fontSans};font-size:15px;line-height:1.5;color:${palette.ink};">${escapeHtml(input.greeting)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(input.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${palette.paper};font-family:${fontSans};color:${palette.ink};">
  ${emailPreheader(input.preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${palette.paper};">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${palette.white};border:1px solid ${palette.line};">
          <tr>
            <td style="height:4px;background:${topBar};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 36px 0;">
              ${emailLetterhead(input.variant)}
              ${emailRule()}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 32px;">
              ${greeting}
              <h1 style="margin:0 0 16px;font-family:${fontDisplay};font-size:26px;line-height:1.25;font-weight:400;color:${palette.deep};">${escapeHtml(input.headline)}</h1>
              <div style="font-family:${fontSans};font-size:15px;line-height:1.7;color:${palette.ink};">${input.body}</div>
              ${footnote}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 24px;border-top:1px solid ${palette.line};background:${palette.paper};">
              ${input.footer}
            </td>
          </tr>
        </table>
        <p style="margin:18px 8px 0;font-family:${fontSans};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${palette.muted};text-align:center;">
          ${emailLink(EMAIL_ASSET_ORIGIN, "thevitaminspotltd.com")}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const customerFooter = `<p style="margin:0 0 10px;font-family:${fontSans};font-size:12px;line-height:1.7;color:${palette.muted};">
  ${escapeHtml(site.legalName)}<br>
  ${emailLink(site.address.mapUrl, site.address.full)}
</p>
<p style="margin:0;font-family:${fontSans};font-size:12px;line-height:1.7;color:${palette.muted};">
  ${emailLink(`mailto:${site.email}`, site.email)} &nbsp;·&nbsp; ${emailLink(`https://wa.me/${site.whatsapp}`, site.phone)} &nbsp;·&nbsp; ${emailLink(site.instagram, site.instagramHandle)}
</p>`;

const adminFooter = `<p style="margin:0;font-family:${fontSans};font-size:12px;line-height:1.65;color:${palette.muted};">
  ${escapeHtml(site.legalName)} — staff notice<br>
  ${emailLink(`${site.url}/admin`, "Open dashboard")}
</p>`;

function customerPreheader(headline: string) {
  return `${headline} — ${site.name}`;
}

export function emailFirstName(name: string) {
  const trimmed = name.trim();
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

export function renderCustomerEmail(input: {
  eyebrow: string;
  headline: string;
  body: string;
  footnote?: string;
  cta?: EmailCta;
  preheader?: string;
}) {
  return emailShell({
    greeting: input.eyebrow,
    headline: input.headline,
    preheader: input.preheader ?? customerPreheader(input.headline),
    body: input.body,
    footnote: input.footnote,
    cta: input.cta,
    footer: customerFooter,
    variant: "customer",
  });
}

export function renderAdminEmail(input: {
  headline: string;
  body: string;
  cta?: EmailCta;
  tone?: "default" | "alert";
  preheader?: string;
}) {
  return emailShell({
    headline: input.headline,
    preheader: input.preheader ?? `${input.headline} (${site.name})`,
    body: input.body,
    cta: input.cta,
    footer: adminFooter,
    variant: "admin",
    alertStripe: input.tone === "alert",
  });
}

export async function sendAdminMail(input: {
  subject: string;
  headline: string;
  body: string;
  cta?: EmailCta;
  tone?: "default" | "alert";
}) {
  return sendMail({
    to: adminRecipients(),
    subject: input.subject,
    html: renderAdminEmail({
      headline: input.headline,
      body: input.body,
      cta: input.cta,
      tone: input.tone,
    }),
  });
}

function bookingClinicalReminder() {
  return emailCallout(
    `Please arrive a few minutes early. Inform us in advance if you are pregnant, taking medication, or have known allergies.`,
    "neutral",
  );
}

function orderSummaryLine(orderNumber: string, total: number) {
  return emailDetailsCard([
    { label: "Order", value: `<strong>${escapeHtml(orderNumber)}</strong>` },
    { label: "Total", value: escapeHtml(formatNaira(total)) },
  ]);
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
        subject: pickup ? "Payment received — ready for packing (pickup)" : "Payment received",
        headline: "Payment received",
        body: pickup
          ? `${emailParagraph("Thank you. We have received payment and are preparing your order for collection at the shop.")}${emailParagraph("You will receive another email when it is ready.", { last: true })}`
          : `${emailParagraph("Thank you. We have received payment and are preparing your order.")}${emailParagraph("You will receive another email when it is dispatched.", { last: true })}`,
      };
    case "PACKED":
      return pickup
        ? {
            subject: "Ready for collection",
            headline: "Ready for collection",
            body: `${emailParagraph("Your order is packed and available for pickup.")}${emailParagraph(`Please collect from <strong>${escapeHtml(shop)}</strong> at your convenience.`, { last: true })}`,
            footnote: "Bring your order number. Reply to this email if you need directions.",
          }
        : {
            subject: "Order packed",
            headline: "Packed",
            body: `${emailParagraph("Your order has been packed and is awaiting dispatch.")}${emailParagraph("We will write again once it is on the way.", { last: true })}`,
          };
    case "OUT_FOR_DELIVERY":
      return {
        subject: "Out for delivery",
        headline: "Out for delivery",
        body: `${emailParagraph("Your order has left the shop and is on its way.")}${emailParagraph("Please keep your phone available in case the courier needs to reach you.", { last: true })}`,
      };
    case "DELIVERED":
      return pickup
        ? {
            subject: "Collected",
            headline: "Collected",
            body: `${emailParagraph("Thank you for collecting your order.")}${emailParagraph("If anything is incorrect, reply to this email and we will put it right.", { last: true })}`,
          }
        : {
            subject: "Delivered",
            headline: "Delivered",
            body: `${emailParagraph("Your order has been marked as delivered.")}${emailParagraph("If anything is missing or damaged, reply to this email and we will put it right.", { last: true })}`,
          };
    case "CANCELLED":
      return {
        subject: "Order cancelled",
        headline: "Order cancelled",
        body: emailParagraph(
          "This order has been cancelled. If this is unexpected, please reply to this email.",
          { last: true },
        ),
      };
    default:
      return {
        subject: "Order update",
        headline: "Order update",
        body: emailParagraph("There has been an update to your order. Please use the link below for the current status.", {
          last: true,
        }),
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

  return sendMail({
    to: input.to,
    subject: `${copy.subject} · ${input.orderNumber}`,
    html: renderCustomerEmail({
      eyebrow: `Dear ${emailFirstName(input.name)},`,
      headline: copy.headline,
      body: `${copy.body}${orderSummaryLine(input.orderNumber, input.total)}`,
      footnote: copy.footnote,
      cta: { label: "View order", href: input.trackUrl },
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
      ? emailCallout(
          `Complete your booking fee of ${escapeHtml(formatNaira(input.deposit))}${
            input.sessionPrice && input.sessionPrice > input.deposit
              ? ` (${escapeHtml(formatNaira(input.sessionPrice - input.deposit))} due at your visit)`
              : ""
          } to hold this slot. Cancellations are not free; the booking fee is non-refundable. ${emailLink(input.manageUrl, "Pay the booking fee")}.`,
          "accent",
        )
      : emailParagraph("We will confirm this time shortly.", { last: true });

  return sendMail({
    to: input.to,
    subject: `Booking received · ${input.serviceName}`,
    html: renderCustomerEmail({
      eyebrow: `Dear ${emailFirstName(input.name)},`,
      headline: "Booking received",
      body: `${emailParagraph(`Thank you for requesting <strong>${escapeHtml(input.serviceName)}</strong>.`)}${emailDetailsCard([
        { label: "Session", value: escapeHtml(input.serviceName) },
        { label: "When", value: escapeHtml(when) },
      ])}${depositDue}`,
      cta: { label: "View booking", href: input.manageUrl },
    }),
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
      ? emailCallout(
          `The remaining balance of ${escapeHtml(formatNaira(input.sessionPrice - input.depositAmount))} is payable at your visit.`,
          "neutral",
        )
      : "";

  return sendMail({
    to: input.to,
    subject: `Deposit received · ${input.serviceName}`,
    html: renderCustomerEmail({
      eyebrow: `Dear ${emailFirstName(input.name)},`,
      headline: "Appointment confirmed",
      body: `${emailParagraph(`We have received your booking fee of ${escapeHtml(formatNaira(input.depositAmount))} for <strong>${escapeHtml(input.serviceName)}</strong>. Your appointment is confirmed. Cancellations are not free; the booking fee is non-refundable.`)}${emailDetailsCard([
        { label: "When", value: escapeHtml(when) },
        { label: "Where", value: escapeHtml(location) },
        { label: "Booking fee", value: escapeHtml(formatNaira(input.depositAmount)) },
      ])}${balance}${bookingClinicalReminder()}`,
      cta: { label: "View booking", href: input.manageUrl },
    }),
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
  const paymentNote = input.depositPaid
    ? emailCallout(
        `Deposit paid: ${escapeHtml(formatNaira(input.depositPaid))}${
          input.sessionPrice && input.sessionPrice > input.depositPaid
            ? `. ${escapeHtml(formatNaira(input.sessionPrice - input.depositPaid))} due at your visit.`
            : "."
        }`,
        "neutral",
      )
      : input.depositDue
      ? emailCallout(
          `Your booking fee of ${escapeHtml(formatNaira(input.depositDue))} is due to hold this slot. Cancellations are not free; the fee is non-refundable. ${emailLink(input.manageUrl, "Pay online")}.`,
          "accent",
        )
      : "";

  return sendMail({
    to: input.to,
    subject: `Appointment confirmed · ${input.serviceName}`,
    html: renderCustomerEmail({
      eyebrow: `Dear ${emailFirstName(input.name)},`,
      headline: "Appointment confirmed",
      body: `${emailParagraph(`Your <strong>${escapeHtml(input.serviceName)}</strong> appointment is confirmed.`)}${emailDetailsCard([
        { label: "Session", value: escapeHtml(input.serviceName) },
        { label: "When", value: escapeHtml(when) },
        { label: "Where", value: escapeHtml(location) },
      ])}${paymentNote}${bookingClinicalReminder()}`,
      cta: { label: "View booking", href: input.manageUrl },
    }),
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
    ? emailCallout(`Reason: ${escapeHtml(input.reason)}`, "neutral")
    : "";
  const depositLine =
    input.depositPaid && input.depositPaid > 0
      ? emailCallout(
          `A booking fee of ${escapeHtml(formatNaira(input.depositPaid))} was received and is not refunded when you cancel.`,
          "alert",
        )
      : "";

  return sendMail({
    to: input.to,
    subject: `Appointment cancelled · ${input.serviceName}`,
    html: renderCustomerEmail({
      eyebrow: `Dear ${emailFirstName(input.name)},`,
      headline: "Appointment cancelled",
      body: `${emailParagraph(`Your <strong>${escapeHtml(input.serviceName)}</strong> appointment on ${escapeHtml(when)} has been cancelled.`, { last: true })}${reasonLine}${depositLine}${emailParagraph(`If this was in error, ${emailLink(`${site.url}/book`, "book again")}.`, { last: true })}`,
      cta: { label: "View booking", href: input.manageUrl },
    }),
  });
}
