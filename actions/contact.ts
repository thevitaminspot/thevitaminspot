"use server";

import { headers } from "next/headers";
import { contactSchema, newsletterSchema } from "@/lib/env";
import { tryPrisma } from "@/lib/db";
import { escapeHtml, sendMail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export async function submitContact(input: unknown) {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  if (!rateLimit(`contact:${ip}`, 5).ok) {
    return { error: "Please wait before sending another note." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const messageTooShort = parsed.error.issues.some((issue) => issue.path[0] === "message");
    return {
      error: messageTooShort
        ? "Write a little more so we know how to help."
        : "Check your name and email, then try again.",
    };
  }

  const prisma = await tryPrisma();
  if (prisma) {
    await prisma.contactMessage.create({ data: parsed.data });
  }

  await sendMail({
    to: site.email,
    subject: `Lounge note from ${parsed.data.name}`,
    html: `<p>${escapeHtml(parsed.data.message)}</p><p>${escapeHtml(parsed.data.email)} · ${escapeHtml(parsed.data.phone ?? "")}</p>`,
  });

  return { ok: true };
}

export async function subscribeNotes(email: string) {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  if (!rateLimit(`notes:${ip}`, 5).ok) {
    return { error: "Please wait before sending another note." };
  }

  const parsed = newsletterSchema.safeParse({ email });
  if (!parsed.success) return { error: "Enter a valid email address." };

  const prisma = await tryPrisma();
  if (prisma) {
    await prisma.contactMessage.create({
      data: {
        name: "Notes list",
        email: parsed.data.email,
        message: "Asked to hear from the lounge.",
      },
    });
  }

  await sendMail({
    to: site.email,
    subject: "Footer note request",
    html: `<p>${escapeHtml(parsed.data.email)} asked to hear from The Vitamin Spot.</p>`,
  });

  return { ok: true };
}
