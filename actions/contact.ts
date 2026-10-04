"use server";

import { headers } from "next/headers";
import { contactSchema, newsletterSchema } from "@/lib/env";
import { tryPrisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { saveNoteEmail } from "@/lib/local-store";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export async function submitContact(input: unknown) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`contact:${ip}`, 5).ok) {
    return { error: "Please wait before sending another note." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { error: "Please complete the form." };

  const prisma = await tryPrisma();
  if (prisma) {
    await prisma.contactMessage.create({ data: parsed.data });
  }

  await sendMail({
    to: site.email,
    subject: `Lounge note from ${parsed.data.name}`,
    html: `<p>${parsed.data.message}</p><p>${parsed.data.email} · ${parsed.data.phone ?? ""}</p>`,
  });

  return { ok: true };
}

export async function subscribeNotes(email: string) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`notes:${ip}`, 5).ok) {
    return { error: "Please wait before sending another note." };
  }

  const parsed = newsletterSchema.safeParse({ email });
  if (!parsed.success) return { error: "Enter a valid email address." };

  await saveNoteEmail(parsed.data.email);
  await sendMail({
    to: site.email,
    subject: "Footer note request",
    html: `<p>${parsed.data.email} asked to hear from The Vitamin Spot.</p>`,
  });

  return { ok: true };
}
