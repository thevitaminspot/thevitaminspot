import "server-only";
import { adminRecipientsExcluding } from "@/lib/admin-access";
import { notifyBookingCancelled, notifyBookingDepositPaid } from "@/lib/booking-notify";
import { formatLagosLong } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";
import {
  emailDetailsCard,
  emailParagraph,
  escapeHtml,
  sendAdminMail,
  sendOrderUpdate,
} from "@/lib/email";
import { hasPaystack } from "@/lib/env";
import { formatNaira } from "@/lib/money";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { invalidateAvailabilityCache, invalidateCatalogCache } from "@/lib/redis";
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

const DEFINITE_FAILURE = new Set(["failed", "reversed", "abandoned"]);
const IN_FLIGHT = new Set(["ongoing", "pending", "processing", "queued"]);

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    order: { include: { items: true } };
    appointment: { include: { service: true } };
  };
}>;

async function notifyAdminPaymentAlert(
  subject: string,
  input: {
    headline: string;
    body: string;
    cta?: { label: string; href: string };
    tone?: "default" | "alert";
  },
) {
  const result = await sendAdminMail({ subject, ...input });
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

/** One customer + admin notification batch per successful settlement (webhook vs return-safe). */
async function claimSettlementNotifications(paymentId: string) {
  const prisma = await tryPrisma();
  if (!prisma) return false;

  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: "PAID", settlementNotifiedAt: null },
    data: { settlementNotifiedAt: new Date() },
  });
  return claimed.count > 0;
}

async function applySettlement(payment: PaymentWithRelations, outcome: "success" | "failed") {
  const prisma = await tryPrisma();
  if (!prisma) return false;

  if (outcome === "failed") {
    if (payment.status === "PAID") return false;

    const released = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      // Unpaid booking fees must not leave a held / successful booking.
      if (
        payment.purpose === "APPOINTMENT_DEPOSIT" &&
        payment.appointmentId &&
        payment.appointment?.status === "PENDING"
      ) {
        const stamp = new Date().toISOString();
        const releaseNote = `[Booking fee unpaid ${stamp}] Payment was not completed. Slot released.`;
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "CANCELLED",
            notes: payment.appointment.notes?.trim()
              ? `${releaseNote}\n\n${payment.appointment.notes.trim()}`
              : releaseNote,
          },
        });
        return true;
      }

      return false;
    });

    if (released && payment.appointment) {
      await notifyBookingCancelled({
        to: payment.appointment.email,
        name: payment.appointment.name,
        serviceName: payment.appointment.service.name,
        startsAt: payment.appointment.startsAt,
        manageUrl: `${site.url}/appointments/${payment.appointment.accessToken}`,
        reason: "Booking fee payment was not completed",
      }).catch((error) => {
        console.error("[paystack:email] unpaid booking cancel notice failed", error);
      });
    }

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
      // Aggregate quantities by productId so duplicate lines cannot bypass stock checks.
      const neededByProduct = new Map<string, number>();
      for (const item of payment.order.items) {
        if (!item.productId) continue;
        neededByProduct.set(
          item.productId,
          (neededByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }
      const productIds = [...neededByProduct.keys()];
      const existingProducts =
        productIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, stock: true },
            })
          : [];
      const stockById = new Map(existingProducts.map((p) => [p.id, p.stock]));

      let stockIssue = false;
      for (const [productId, quantity] of neededByProduct) {
        if ((stockById.get(productId) ?? -1) < quantity) {
          stockIssue = true;
          break;
        }
      }

      if (stockIssue) {
        await tx.order.updateMany({
          where: { id: payment.orderId, status: { not: "CANCELLED" } },
          data: {
            status: "PAID",
            notes: "Paid, but stock ran short at settlement. Check inventory and contact the customer.",
          },
        });
      } else {
        const decremented: { id: string; quantity: number }[] = [];

        for (const [productId, quantity] of neededByProduct) {
          const row = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (row.count === 0) {
            stockIssue = true;
            break;
          }
          decremented.push({ id: productId, quantity });
        }

        if (stockIssue) {
          for (const item of decremented) {
            await tx.product.update({
              where: { id: item.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await tx.order.updateMany({
          where: { id: payment.orderId, status: { not: "CANCELLED" } },
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
      await tx.appointment.updateMany({
        where: { id: payment.appointmentId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
    }

    return true;
  });

  if (paid) {
    // Stock changes and newly confirmed appointments must be visible across all serverless instances.
    await Promise.all([
      payment.orderId ? invalidateCatalogCache("products") : Promise.resolve(),
      payment.appointmentId ? invalidateAvailabilityCache() : Promise.resolve(),
    ]);
  }

  if (paid && orderCancelled && payment.order) {
    await notifyAdminPaymentAlert(`Payment on cancelled order ${payment.order.orderNumber}`, {
      headline: "Refund may be needed",
      tone: "alert",
      body: `${emailParagraph(`A customer paid <strong>${escapeHtml(formatNaira(payment.amount))}</strong> for cancelled order <strong>${escapeHtml(payment.order.orderNumber)}</strong>. Issue a Paystack refund.`)}${emailDetailsCard([
        { label: "Order", value: escapeHtml(payment.order.orderNumber) },
        { label: "Amount", value: escapeHtml(formatNaira(payment.amount)) },
      ])}`,
      cta: {
        label: "Open in admin",
        href: `${site.url}/admin/orders/detail?id=${payment.order.id}`,
      },
    });
    return true;
  }

  if (paid && appointmentCancelled && payment.appointment) {
    await notifyAdminPaymentAlert(`Deposit on cancelled booking: ${payment.appointment.service.name}`, {
      headline: "Deposit after cancellation",
      tone: "alert",
      body: `${emailParagraph(`${escapeHtml(payment.appointment.name)} paid <strong>${escapeHtml(formatNaira(payment.amount))}</strong> after cancelling their session. Refund or rebook manually.`)}${emailDetailsCard([
        { label: "Session", value: escapeHtml(payment.appointment.service.name) },
        {
          label: "Was for",
          value: escapeHtml(formatLagosLong(payment.appointment.startsAt)),
        },
      ])}`,
      cta: { label: "Open bookings", href: `${site.url}/admin/appointments` },
    });
    return true;
  }

  if (paid && payment.order && !orderCancelled) {
    const shouldNotify = await claimSettlementNotifications(payment.id);
    if (shouldNotify) {
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

      const adminMail = await sendAdminMail({
        to: adminRecipientsExcluding(payment.order.email),
        subject: `New order ${payment.order.orderNumber}`,
        headline: "New paid order",
        body: `${emailParagraph(`<strong>${escapeHtml(payment.order.name)}</strong> completed checkout.`)}${emailDetailsCard([
          { label: "Order", value: escapeHtml(payment.order.orderNumber) },
          { label: "Total", value: escapeHtml(formatNaira(payment.order.total)) },
        ])}`,
        cta: {
          label: "Open order",
          href: `${site.url}/admin/orders/detail?id=${payment.order.id}`,
        },
      });
      if (!adminMail.ok) {
        console.error("[paystack:email] admin paid notification failed", adminMail.error);
      }

      const order = await prisma.order.findUnique({ where: { id: payment.orderId! } });
      if (order?.notes?.includes("stock ran short")) {
        await sendAdminMail({
          to: adminRecipientsExcluding(payment.order.email),
          subject: `Stock issue on ${order.orderNumber}`,
          headline: "Stock short at settlement",
          tone: "alert",
          body: emailParagraph(
            `Order <strong>${escapeHtml(order.orderNumber)}</strong> was paid, but inventory ran short during settlement. Check stock and contact the guest.`,
            { last: true },
          ),
          cta: { label: "Open order", href: `${site.url}/admin/orders/detail?id=${order.id}` },
        }).catch(() => undefined);
      }
    }
  }

  if (paid && payment.appointment && !appointmentCancelled) {
    const shouldNotify = await claimSettlementNotifications(payment.id);
    if (shouldNotify) {
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

      const adminMail = await sendAdminMail({
        to: adminRecipientsExcluding(appointment.email),
        subject: `Deposit paid: ${appointment.service.name}`,
        headline: "Booking deposit received",
        body: `${emailParagraph(`<strong>${escapeHtml(appointment.name)}</strong> paid a deposit.`)}${emailDetailsCard([
          { label: "Session", value: escapeHtml(appointment.service.name) },
          { label: "When", value: escapeHtml(formatLagosLong(appointment.startsAt)) },
          { label: "Deposit", value: escapeHtml(formatNaira(payment.amount)) },
        ])}`,
        cta: { label: "Open bookings", href: `${site.url}/admin/appointments` },
      });
      if (!adminMail.ok) {
        console.error("[paystack:email] admin deposit notification failed", adminMail.error);
      }
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
    // Never overwrite a paid reference or let an abandoned attempt's failure cancel a newer attempt.
    if (payment.status === "PAID" || data.status !== "success") {
      console.info(
        "[paystack:webhook] ignoring stale reference",
        data.reference,
        "status",
        data.status,
        "current",
        payment.paystackReference,
      );
      return null;
    }
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
      await notifyAdminPaymentAlert("Paystack payment could not be matched", {
        headline: "Unmatched Paystack charge",
        tone: "alert",
        body: `${emailParagraph("A successful-looking charge could not be linked to an order or booking.")}${emailDetailsCard([
          { label: "Reference", value: escapeHtml(data.reference) },
          { label: "Status", value: escapeHtml(data.status) },
          {
            label: "Metadata",
            value: escapeHtml(JSON.stringify(data.metadata ?? {})),
          },
        ])}`,
      });
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
    await notifyAdminPaymentAlert(`Paystack amount mismatch: ${data.reference}`, {
      headline: "Paystack amount mismatch",
      tone: "alert",
      body: emailDetailsCard([
        { label: "Reference", value: escapeHtml(data.reference) },
        {
          label: "Expected",
          value: `${escapeHtml(formatNaira(payment.amount))} ${escapeHtml(expectedCurrency)}`,
        },
        {
          label: "Received",
          value: `${escapeHtml(String(data.amount))} ${escapeHtml(receivedCurrency)}`,
        },
      ]),
    });
    return { ok: true as const, flagged: true as const };
  }

  await applySettlement(payment, "success");
  return { ok: true as const };
}

async function settlePaystackReturn(
  reference: string,
  payment: PaymentWithRelations,
  transaction: { status: string; amount: number; currency?: string },
): Promise<PaystackVerifyResult> {
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
    await notifyAdminPaymentAlert(`Paystack return mismatch: ${reference}`, {
      headline: "Return amount mismatch",
      tone: "alert",
      body: emailDetailsCard([
        { label: "Reference", value: escapeHtml(reference) },
        {
          label: "Paid",
          value: `${escapeHtml(String(transaction.amount))} ${escapeHtml(receivedCurrency)}`,
        },
        {
          label: "Expected",
          value: `${escapeHtml(formatNaira(payment.amount))} ${escapeHtml(expectedCurrency)}`,
        },
      ]),
    });
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
}

export async function confirmPaystackReturn(
  reference: string | undefined,
  owner?: PaystackReturnOwner,
): Promise<PaystackVerifyResult> {
  if (!hasPaystack()) return { outcome: "skipped" };

  if (!reference && owner) {
    const prisma = await tryPrisma();
    if (!prisma) return { outcome: "skipped" };
    const pending = "orderToken" in owner
      ? await prisma.payment.findFirst({
          where: { order: { accessToken: owner.orderToken }, status: "PENDING" },
        })
      : await prisma.payment.findFirst({
          where: {
            appointment: { accessToken: owner.appointmentToken },
            status: "PENDING",
          },
        });
    if (!pending?.paystackReference) return { outcome: "skipped" };

    try {
      const payment = await loadPaymentByReference(pending.paystackReference);
      if (!payment || !paymentMatchesOwner(payment, owner)) {
        return { outcome: "skipped" };
      }
      const transaction = await verifyPaystackTransaction(pending.paystackReference);
      return settlePaystackReturn(pending.paystackReference, payment, transaction);
    } catch (error) {
      console.error("[paystack:return]", pending.paystackReference, error);
      return {
        outcome: "error",
        message: error instanceof Error ? error.message : "Paystack could not verify that payment.",
      };
    }
  }

  if (!reference) return { outcome: "skipped" };

  try {
    const prisma = await tryPrisma();
    if (!prisma) {
      return { outcome: "error", message: "Checkout needs the database." };
    }

    // Verify local payment ownership and pending state BEFORE calling Paystack's API.
    const payment = await loadPaymentByReference(reference);
    if (!payment) {
      console.info("[paystack:return] unknown reference", reference);
      return { outcome: "error", message: "Payment not found." };
    }

    if (!paymentMatchesOwner(payment, owner)) {
      console.info("[paystack:return] owner mismatch", reference);
      return { outcome: "skipped" };
    }

    if (payment.status === "PAID") {
      return { outcome: "paid" };
    }

    const transaction = await verifyPaystackTransaction(reference);
    return settlePaystackReturn(reference, payment, transaction);
  } catch (error) {
    console.error("[paystack:return]", reference, error);
    return {
      outcome: "error",
      message: "Paystack could not verify that payment.",
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
