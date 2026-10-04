import { verifyPaystackSignature } from "@/lib/paystack";
import { tryPrisma } from "@/lib/db";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    if (!verifyPaystackSignature(raw, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Paystack is not configured" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    data: { reference: string; status: string };
  };

  const prisma = await tryPrisma();
  if (!prisma) return Response.json({ received: true });

  const payment = await prisma.payment.findUnique({
    where: { paystackReference: event.data.reference },
  });
  if (!payment) return Response.json({ received: true });

  if (event.event === "charge.success" && event.data.status === "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID" },
    });
    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    }
    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }
  }

  return Response.json({ received: true });
}
