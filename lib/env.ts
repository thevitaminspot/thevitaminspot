import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
};

export function hasClerk() {
  return Boolean(publicEnv.clerkPublishableKey && process.env.CLERK_SECRET_KEY);
}

export function hasPaystack() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function getPaystackSecret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().max(32).optional(),
  message: z.string().trim().min(12).max(5000),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().min(8).max(32),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  zoneSlug: z.string().max(80).optional(),
  addressLine1: z.string().trim().max(240).optional(),
  addressLine2: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const bookingDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .max(32),
  notes: z.string().trim().max(1000).optional(),
});

export function parseBookingDetails(input: {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}) {
  const parsed = bookingDetailsSchema.safeParse({
    name: input.name ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    notes: input.notes ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Please complete your details.",
    };
  }
  const notes = parsed.data.notes?.trim();
  return {
    ok: true as const,
    data: { ...parsed.data, notes: notes || undefined },
  };
}

export const newsletterSchema = z.object({
  email: z.email(),
});

void optionalUrl;
