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

/** Delivery check styled to match the production email templates in lib/email.ts. */
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta name="format-detection" content="telephone=no,address=no,email=no">
  <title>Email delivery test</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#08150f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f0;">
    <tr><td align="center" style="padding:36px 16px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e3e8df;border-radius:18px;overflow:hidden;">
        <tr><td style="height:5px;background:#0b2c21;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 24px 0;">
          <p style="margin:0;font-size:15px;line-height:1.2;font-weight:750;color:#0b2c21;">The Vitamin Spot</p>
          <p style="margin:5px 0 0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#56635b;">Email delivery check</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
            <tr><td style="height:1px;background:#e3e8df;font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 24px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe4;border-radius:14px;">
            <tr><td style="padding:28px 22px 30px;">
              <p style="margin:0 0 12px;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8ba575;">Email delivery test</p>
              <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:750;letter-spacing:-0.035em;color:#08150f;">Hey there,</h1>
            </td></tr>
          </table>
          <p style="margin:22px 0 0;font-size:15px;line-height:1.7;">If you received this, Resend is working for this recipient. Transactional mail uses the shared template in <strong>lib/email.ts</strong>.</p>
        </td></tr>
        <tr><td style="padding:22px 24px 26px;border-top:1px solid #e3e8df;background:#f3f5f0;">
          <p style="margin:0;font-size:12px;line-height:1.7;color:#56635b;">The Vitamin Spot<br>Abuja · Shop &amp; IV</p>
        </td></tr>
      </table>
      <p style="margin:18px 8px 0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#56635b;text-align:center;">thevitaminspotltd.com</p>
    </td></tr>
  </table>
</body>
</html>`;

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
