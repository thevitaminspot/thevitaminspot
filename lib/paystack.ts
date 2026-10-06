import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPaystackSecret } from "@/lib/env";

const PAYSTACK_API = "https://api.paystack.co";

type InitializeInput = {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export async function initializePaystack(input: InitializeInput) {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "NGN",
      metadata: input.metadata,
    }),
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };

  if (!payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack could not start the payment.");
  }

  return payload.data;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = createHmac("sha512", getPaystackSecret()).update(rawBody).digest("hex");
  const expected = Buffer.from(hash);
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getPaystackSecret()}` },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { status: string; amount: number; currency: string; reference: string };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack could not verify that payment.");
  }

  return payload.data;
}
