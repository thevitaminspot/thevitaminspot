import { handlePaystackWebhookCharge } from "@/lib/payments";
import { verifyPaystackSignature } from "@/lib/paystack";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type PaystackEvent = {
  event: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    metadata?: { orderId?: string; appointmentId?: string; purpose?: string };
  };
};

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  const volume = rateLimit(`webhook:ip:${ip}`, "webhook");
  if (!volume.ok) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(volume.retryAfterSec) },
      },
    );
  }

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    if (!verifyPaystackSignature(raw, signature)) {
      const rejects = rateLimit(`webhook:bad:${ip}`, "webhookReject");
      if (!rejects.ok) {
        return Response.json(
          { error: "Too many invalid attempts" },
          {
            status: 429,
            headers: { "Retry-After": String(rejects.retryAfterSec) },
          },
        );
      }
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

  // One active settlement path per reference — blocks replay floods of the same charge.
  const refHit = rateLimit(`webhook:ref:${data.reference}`, "paymentConfirm");
  if (!refHit.ok) {
    return Response.json({ received: true, throttled: true });
  }

  if (event.event === "charge.success" || event.event === "charge.failed") {
    await handlePaystackWebhookCharge({
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      currency: data.currency ?? "NGN",
      metadata: data.metadata,
    });
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
