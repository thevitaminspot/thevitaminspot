import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
};

export function hasSupabase() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
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
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  notes: z.string().optional(),
});

export const newsletterSchema = z.object({
  email: z.email(),
});

void optionalUrl;
