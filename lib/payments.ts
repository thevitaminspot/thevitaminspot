import "server-only";
import { tryPrisma } from "@/lib/db";
import { notifyBookingDepositPaid } from "@/lib/booking-notify";
import { escapeHtml, sendMail, sendOrderUpdate } from "@/lib/email";
import { hasPaystack } from "@/lib/env";
import { formatNaira } from "@/lib/money";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { site } from "@/lib/site";

export type PaystackWebhookCharge = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
};

export async function settlePaystackReference(reference: string, outcome: "success" | "failed") {
  const prisma = await tryPrisma();
  if (!prisma) return;

  const payment = await prisma.payment.findUnique({
    where: { paystackReference: reference },
    include: {
      order: { include: { items: true } },
      appointment: { include: { service: true } },
    },
  });
  if (!payment) return;

  if (outcome === "failed") {
    if (payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }
    return;
  }

  if (payment.status === "PAID") return;

  const paid = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    if (updated.count === 0) return false;

    if (payment.orderId && payment.order) {
      let stockIssue = false;

      for (const item of payment.order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          stockIssue = true;
          break;
        }
      }

      if (stockIssue) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: "PAID",
            notes: "Paid, but stock ran short at settlement. Check inventory and contact the customer.",
          },
        });
      } else {
        const decremented: { id: string; quantity: number }[] = [];

        for (const item of payment.order.items) {
          if (!item.productId) continue;
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            stockIssue = true;
            break;
          }
          decremented.push({ id: item.productId, quantity: item.quantity });
        }

        if (stockIssue) {
          for (const item of decremented) {
            await tx.product.update({
              where: { id: item.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: stockIssue
            ? {
                status: "PAID",
                notes: "Paid, but stock ran short at settlement. Check inventory and contact the customer.",
              }
            : { status: "PAID" },
        });
      }
    }

    if (payment.appointmentId) {
      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }

    return true;
  });

  if (paid && payment.order) {
    const customerMail = await sendOrderUpdate({
      to: payment.order.email,
      name: payment.order.name,
      orderNumber: payment.order.orderNumber,
      status: "PAID",
      total: payment.order.total,
      trackUrl: `${site.url}/orders/${payment.order.accessToken}`,
    });
    if (!customerMail.ok) {
      console.error("[paystack:email] customer order confirmation failed", customerMail.error);
    }

    const adminMail = await sendMail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `Paid: ${payment.order.orderNumber}`,
      html: `<p>${escapeHtml(payment.order.name)} paid ${escapeHtml(payment.order.orderNumber)}.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${payment.order.id}`)}">Open in admin</a></p>`,
    });
    if (!adminMail.ok) {
      console.error("[paystack:email] admin paid notification failed", adminMail.error);
    }

    const order = await prisma.order.findUnique({ where: { id: payment.orderId! } });
    if (order?.notes?.includes("stock ran short")) {
      await sendMail({
        to: process.env.ADMIN_EMAIL ?? site.email,
        subject: `Stock issue on ${order.orderNumber}`,
        html: `<p>Order ${escapeHtml(order.orderNumber)} was paid, but stock was short during settlement.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${order.id}`)}">Open in admin</a></p>`,
      }).catch(() => undefined);
    }
  }

  if (paid && payment.appointment) {
    const appointment = payment.appointment;
    try {
      await notifyBookingDepositPaid({
        to: appointment.email,
        name: appointment.name,
        serviceName: appointment.service.name,
        startsAt: appointment.startsAt,
        manageUrl: `${site.url}/appointments/${appointment.accessToken}`,
        depositAmount: payment.amount,
        sessionPrice: appointment.service.price,
      });
    } catch (error) {
      console.error("[paystack:email] booking deposit confirmation failed", error);
    }

    const adminMail = await sendMail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `Deposit paid: ${appointment.service.name}`,
      html: `<p>${escapeHtml(appointment.name)} paid a deposit of ${escapeHtml(formatNaira(payment.amount))} for ${escapeHtml(appointment.service.name)} on ${escapeHtml(appointment.startsAt.toLocaleString("en-NG"))}.</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
    });
    if (!adminMail.ok) {
      console.error("[paystack:email] admin deposit notification failed", adminMail.error);
    }
  }
}

export async function handlePaystackWebhookCharge(data: PaystackWebhookCharge) {
  const prisma = await tryPrisma();
  if (!prisma) {
    console.error("[paystack:webhook] DATABASE_URL not configured");
    return { ok: false as const, error: "database_unavailable" };
  }

  const payment = await prisma.payment.findUnique({
    where: { paystackReference: data.reference },
  });

  if (!payment) {
    console.info("[paystack:webhook] unknown reference", data.reference);
    return { ok: true as const, ignored: true as const };
  }

  if (data.status === "failed") {
    await settlePaystackReference(data.reference, "failed");
    return { ok: true as const };
  }

  if (data.status !== "success") {
    return { ok: true as const, ignored: true as const };
  }

  const expectedCurrency = payment.currency || "NGN";
  const receivedCurrency = data.currency || "NGN";
  if (payment.amount !== data.amount || expectedCurrency !== receivedCurrency) {
    console.error(
      "[paystack:webhook] amount mismatch",
      data.reference,
      "expected",
      payment.amount,
      payment.currency,
      "got",
      data.amount,
      data.currency,
    );
    return { ok: false as const, error: "amount_mismatch" };
  }

  await settlePaystackReference(data.reference, "success");
  return { ok: true as const };
}

export async function confirmPaystackReturn(reference: string | undefined) {
  if (!reference || !hasPaystack()) return;

  try {
    const transaction = await verifyPaystackTransaction(reference);
    const prisma = await tryPrisma();
    const payment = prisma
      ? await prisma.payment.findUnique({ where: { paystackReference: reference } })
      : null;
    if (!payment) {
      console.info("[paystack:return] unknown reference", reference);
      return;
    }

    const expectedCurrency = payment.currency || "NGN";
    const receivedCurrency = transaction.currency || "NGN";
    const amountMatches = transaction.amount === payment.amount;
    const currencyMatches = receivedCurrency === expectedCurrency;

    if (transaction.status === "success" && amountMatches && currencyMatches) {
      await settlePaystackReference(reference, "success");
      return;
    }

    if (transaction.status === "success" && (!amountMatches || !currencyMatches)) {
      console.error("[paystack:return] mismatch", {
        reference,
        expected: { amount: payment.amount, currency: expectedCurrency },
        received: { amount: transaction.amount, currency: receivedCurrency },
      });
      return;
    }

    if (transaction.status === "failed" || transaction.status === "abandoned") {
      await settlePaystackReference(reference, "failed");
    }
  } catch (error) {
    console.error("[paystack:return]", reference, error);
  }
}
