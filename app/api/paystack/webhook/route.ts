import { handlePaystackWebhookCharge } from "@/lib/payments";
import { verifyPaystackSignature } from "@/lib/paystack";

export const runtime = "nodejs";

type PaystackEvent = {
  event: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    if (!verifyPaystackSignature(raw, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Paystack is not configured" }, { status: 503 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data;
  if (!data?.reference || !data.status || typeof data.amount !== "number") {
    return Response.json({ received: true, ignored: true });
  }

  if (event.event === "charge.success" || event.event === "charge.failed") {
    const result = await handlePaystackWebhookCharge({
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      currency: data.currency ?? "NGN",
    });

    if (!result.ok && result.error === "amount_mismatch") {
      return Response.json({ error: "Amount mismatch" }, { status: 422 });
    }
  }

  return Response.json({ received: true });
}

export async function GET() {
  return Response.json(
    {
      ok: true,
      message: "Paystack webhook endpoint. POST signed events from Paystack only.",
      url: "/api/paystack/webhook",
    },
    { status: 200 },
  );
}
