import "dotenv/config";
import { Resend } from "resend";

const to = process.argv[2] ?? process.env.ADMIN_EMAIL;
const from =
  process.env.RESEND_FROM_EMAIL ?? "The Vitamin Spot <hello@thevitaminspotltd.com>";

if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY in .env");
  process.exit(1);
}

if (!to) {
  console.error("Usage: npm run email:test [recipient@email.com]");
  process.exit(1);
}

/** Minimal sample matching production layout (full templates live in lib/email.ts). */
const html = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:24px;font-family:Georgia,serif;background:#f4efe4;color:#08150f;">
<p style="max-width:520px;margin:0 auto;padding:20px;background:#fff;border:1px solid #e6d7b8;border-radius:16px;">
  <strong>The Vitamin Spot</strong> — email delivery test.<br><br>
  If you received this, Resend is working for this recipient. Transactional mail uses the shared template in <code>lib/email.ts</code>.
</p>
</body></html>`;

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from,
  to,
  subject: "The Vitamin Spot — email test",
  html,
  text: "The Vitamin Spot — email delivery test. If you received this, Resend is working.",
  replyTo: process.env.ADMIN_EMAIL ?? "thevitaminspotltd@gmail.com",
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Sent", data.id, "to", to, "from", from);
