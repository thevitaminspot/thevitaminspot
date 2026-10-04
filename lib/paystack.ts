import "server-only";
import { createHmac } from "node:crypto";
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
  const hash = createHmac("sha512", getPaystackSecret())
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
