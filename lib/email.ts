import "server-only";
import { Resend } from "resend";
import { site } from "@/lib/site";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info("[email:skipped]", input.subject, input.to);
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? `${site.name} <hello@thevitaminspot.ng>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
