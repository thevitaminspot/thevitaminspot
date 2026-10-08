import "server-only";
import { adminRecipients } from "@/lib/admin-access";
import { notifyBookingDepositPaid } from "@/lib/booking-notify";
import { formatLagosLong } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";
import { escapeHtml, sendMail, sendOrderUpdate } from "@/lib/email";
import { hasPaystack } from "@/lib/env";
import { formatNaira } from "@/lib/money";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { site } from "@/lib/site";
import type { Prisma } from "@/lib/generated/prisma/client";

export type PaystackWebhookCharge = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: { orderId?: string; appointmentId?: string; purpose?: string };
};

export type PaystackReturnOwner =
  | { orderToken: string }
  | { appointmentToken: string };

export type PaystackVerifyResult =
  | { outcome: "paid" }
  | { outcome: "failed" }
  | { outcome: "pending" }
  | { outcome: "skipped" }
  | { outcome: "error"; message: string };

const DEFINITE_FAILURE = new Set(["failed", "reversed"]);
const IN_FLIGHT = new Set(["abandoned", "ongoing", "pending", "processing", "queued"]);

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    order: { include: { items: true } };
    appointment: { include: { service: true } };
  };
}>;

async function notifyAdminPaymentAlert(subject: string, html: string) {
  const result = await sendMail({
    to: adminRecipients(),
    subject,
    html,
  });
  if (!result.ok) {
    console.error("[paystack:email] admin alert failed", result.error);
  }
}

async function loadPaymentByReference(reference: string) {
  const prisma = await tryPrisma();
  if (!prisma) return null;
  return prisma.payment.findUnique({
    where: { paystackReference: reference },
    include: {
      order: { include: { items: true } },
      appointment: { include: { service: true } },
    },
  });
}

function paymentMatchesOwner(payment: PaymentWithRelations, owner?: PaystackReturnOwner) {
  if (!owner) return true;
  if ("orderToken" in owner) {
    return payment.order?.accessToken === owner.orderToken;
  }
  return payment.appointment?.accessToken === owner.appointmentToken;
}

async function applySettlement(payment: PaymentWithRelations, outcome: "success" | "failed") {
  const prisma = await tryPrisma();
  if (!prisma) return false;

  if (outcome === "failed") {
    if (payment.status === "PAID") return false;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return false;
  }

  if (payment.status === "PAID") return false;

  const orderCancelled = payment.order?.status === "CANCELLED";
  const appointmentCancelled = payment.appointment?.status === "CANCELLED";

  const paid = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    if (updated.count === 0) return false;

    if (payment.orderId && payment.order && !orderCancelled) {
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
          const row = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (row.count === 0) {
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

    if (payment.appointmentId && payment.appointment?.status === "PENDING") {
      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }

    return true;
  });

  if (paid && orderCancelled && payment.order) {
    await notifyAdminPaymentAlert(
      `Payment on cancelled order ${payment.order.orderNumber}`,
      `<p>A customer paid ${escapeHtml(formatNaira(payment.amount))} for cancelled order ${escapeHtml(payment.order.orderNumber)}. Issue a Paystack refund.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${payment.order.id}`)}">Open in admin</a></p>`,
    );
    return true;
  }

  if (paid && appointmentCancelled && payment.appointment) {
    await notifyAdminPaymentAlert(
      `Deposit on cancelled booking: ${payment.appointment.service.name}`,
      `<p>${escapeHtml(payment.appointment.name)} paid ${escapeHtml(formatNaira(payment.amount))} after cancelling ${escapeHtml(payment.appointment.service.name)} on ${escapeHtml(formatLagosLong(payment.appointment.startsAt))}. Refund or rebook manually.</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
    );
    return true;
  }

  if (paid && payment.order && !orderCancelled) {
    const customerMail = await sendOrderUpdate({
      to: payment.order.email,
      name: payment.order.name,
      orderNumber: payment.order.orderNumber,
      status: "PAID",
      total: payment.order.total,
      trackUrl: `${site.url}/orders/${payment.order.accessToken}`,
      fulfillment: payment.order.fulfillment,
    });
    if (!customerMail.ok) {
      console.error("[paystack:email] customer order confirmation failed", customerMail.error);
    }

    const adminMail = await sendMail({
      to: adminRecipients(),
      subject: `New order ${payment.order.orderNumber}`,
      html: `<p>${escapeHtml(payment.order.name)} paid ${escapeHtml(payment.order.orderNumber)}.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${payment.order.id}`)}">Open in admin</a></p>`,
    });
    if (!adminMail.ok) {
      console.error("[paystack:email] admin paid notification failed", adminMail.error);
    }

    const order = await prisma.order.findUnique({ where: { id: payment.orderId! } });
    if (order?.notes?.includes("stock ran short")) {
      await sendMail({
        to: adminRecipients(),
        subject: `Stock issue on ${order.orderNumber}`,
        html: `<p>Order ${escapeHtml(order.orderNumber)} was paid, but stock was short during settlement.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${order.id}`)}">Open in admin</a></p>`,
      }).catch(() => undefined);
    }
  }

  if (paid && payment.appointment && !appointmentCancelled) {
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
      to: adminRecipients(),
      subject: `Deposit paid: ${appointment.service.name}`,
      html: `<p>${escapeHtml(appointment.name)} paid a deposit of ${escapeHtml(formatNaira(payment.amount))} for ${escapeHtml(appointment.service.name)} on ${escapeHtml(formatLagosLong(appointment.startsAt))}.</p><p><a href="${escapeHtml(`${site.url}/admin/appointments`)}">Open bookings</a></p>`,
    });
    if (!adminMail.ok) {
      console.error("[paystack:email] admin deposit notification failed", adminMail.error);
    }
  }

  return paid;
}

export async function settlePaystackReference(reference: string, outcome: "success" | "failed") {
  const payment = await loadPaymentByReference(reference);
  if (!payment) return;
  await applySettlement(payment, outcome);
}

async function resolvePaymentForWebhook(data: PaystackWebhookCharge) {
  let payment = await loadPaymentByReference(data.reference);
  if (payment) return payment;

  const prisma = await tryPrisma();
  if (!prisma || !data.metadata) return null;

  if (data.metadata.orderId) {
    payment = await prisma.payment.findFirst({
      where: { orderId: data.metadata.orderId, purpose: "ORDER" },
      include: {
        order: { include: { items: true } },
        appointment: { include: { service: true } },
      },
    });
  } else if (data.metadata.appointmentId) {
    payment = await prisma.payment.findFirst({
      where: { appointmentId: data.metadata.appointmentId, purpose: "APPOINTMENT_DEPOSIT" },
      include: {
        order: { include: { items: true } },
        appointment: { include: { service: true } },
      },
    });
  }

  if (payment && payment.paystackReference !== data.reference) {
    console.info(
      "[paystack:webhook] stale reference paid",
      data.reference,
      "expected",
      payment.paystackReference,
    );
    await prisma.payment.update({
      where: { id: payment.id },
      data: { paystackReference: data.reference },
    });
    payment = { ...payment, paystackReference: data.reference };
  }

  return payment;
}

export async function handlePaystackWebhookCharge(data: PaystackWebhookCharge) {
  const prisma = await tryPrisma();
  if (!prisma) {
    console.error("[paystack:webhook] DATABASE_URL not configured");
    return { ok: false as const, error: "database_unavailable" };
  }

  const payment = await resolvePaymentForWebhook(data);

  if (!payment) {
    console.info("[paystack:webhook] unknown reference", data.reference);
    if (data.metadata?.orderId || data.metadata?.appointmentId) {
      await notifyAdminPaymentAlert(
        "Paystack payment could not be matched",
        `<p>Reference ${escapeHtml(data.reference)} (${escapeHtml(data.status)}) could not be matched. Metadata: ${escapeHtml(JSON.stringify(data.metadata ?? {}))}</p>`,
      );
    }
    return { ok: true as const, ignored: true as const };
  }

  if (data.status === "failed") {
    await applySettlement(payment, "failed");
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
    await notifyAdminPaymentAlert(
      `Paystack amount mismatch: ${data.reference}`,
      `<p>Expected ${escapeHtml(formatNaira(payment.amount))} ${escapeHtml(expectedCurrency)} but received ${escapeHtml(String(data.amount))} ${escapeHtml(receivedCurrency)} for reference ${escapeHtml(data.reference)}.</p>`,
    );
    return { ok: true as const, flagged: true as const };
  }

  await applySettlement(payment, "success");
  return { ok: true as const };
}

export async function confirmPaystackReturn(
  reference: string | undefined,
  owner?: PaystackReturnOwner,
): Promise<PaystackVerifyResult> {
  if (!reference || !hasPaystack()) return { outcome: "skipped" };

  try {
    const transaction = await verifyPaystackTransaction(reference);
    const prisma = await tryPrisma();
    if (!prisma) {
      return { outcome: "error", message: "Checkout needs the database." };
    }

    const payment = await loadPaymentByReference(reference);
    if (!payment) {
      console.info("[paystack:return] unknown reference", reference);
      return { outcome: "error", message: "Payment not found." };
    }

    if (!paymentMatchesOwner(payment, owner)) {
      console.info("[paystack:return] owner mismatch", reference);
      return { outcome: "skipped" };
    }

    const expectedCurrency = payment.currency || "NGN";
    const receivedCurrency = transaction.currency || "NGN";
    const amountMatches = transaction.amount === payment.amount;
    const currencyMatches = receivedCurrency === expectedCurrency;

    if (transaction.status === "success" && amountMatches && currencyMatches) {
      await applySettlement(payment, "success");
      return { outcome: "paid" };
    }

    if (transaction.status === "success" && (!amountMatches || !currencyMatches)) {
      console.error("[paystack:return] mismatch", {
        reference,
        expected: { amount: payment.amount, currency: expectedCurrency },
        received: { amount: transaction.amount, currency: receivedCurrency },
      });
      await notifyAdminPaymentAlert(
        `Paystack return mismatch: ${reference}`,
        `<p>Customer paid ${escapeHtml(String(transaction.amount))} ${escapeHtml(receivedCurrency)} but we expected ${escapeHtml(formatNaira(payment.amount))} ${escapeHtml(expectedCurrency)}.</p>`,
      );
      return {
        outcome: "error",
        message: "Payment amount could not be verified. Contact us if you were charged.",
      };
    }

    if (DEFINITE_FAILURE.has(transaction.status)) {
      await applySettlement(payment, "failed");
      return { outcome: "failed" };
    }

    if (IN_FLIGHT.has(transaction.status)) {
      return { outcome: "pending" };
    }

    return { outcome: "pending" };
  } catch (error) {
    console.error("[paystack:return]", reference, error);
    return {
      outcome: "error",
      message: error instanceof Error ? error.message : "Paystack could not verify that payment.",
    };
  }
}

export async function verifyAndSettleExistingReference(reference: string) {
  if (!hasPaystack()) return { settled: false as const };
  try {
    const transaction = await verifyPaystackTransaction(reference);
    if (transaction.status !== "success") return { settled: false as const };

    const payment = await loadPaymentByReference(reference);
    if (!payment || payment.status === "PAID") {
      return { settled: payment?.status === "PAID" };
    }

    const amountMatches = transaction.amount === payment.amount;
    const currencyMatches = (transaction.currency || "NGN") === (payment.currency || "NGN");
    if (!amountMatches || !currencyMatches) return { settled: false as const };

    await applySettlement(payment, "success");
    return { settled: true as const };
  } catch {
    return { settled: false as const };
  }
}

export function nextPaystackReference(prefix: "ord" | "apt", entityId: string) {
  return `${prefix}_${entityId}_${Date.now().toString(36)}`;
}
