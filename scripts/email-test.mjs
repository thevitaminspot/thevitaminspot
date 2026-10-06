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

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from,
  to,
  subject: "The Vitamin Spot — email test",
  html: "<p>If you received this, Resend is working for this recipient.</p>",
  replyTo: process.env.ADMIN_EMAIL ?? "thevitaminspotltd@gmail.com",
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Sent", data.id, "to", to, "from", from);
