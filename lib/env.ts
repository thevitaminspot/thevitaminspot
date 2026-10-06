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
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
  message: z.string().min(12),
});

export const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  zoneSlug: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name."),
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number."),
  notes: z.string().trim().optional(),
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
