"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { deliveryZones } from "@/lib/catalog";
import { attachCustomer, getSessionProfile } from "@/lib/auth";
import { assertHumanRequest } from "@/lib/bot-guard";
import { checkoutSchema, hasPaystack } from "@/lib/env";
import { tryPrisma } from "@/lib/db";
import {
  nextPaystackReference,
  verifyAndSettleExistingReference,
} from "@/lib/payments";
import { initializePaystack } from "@/lib/paystack";
import { orderPaystackReturnUrl, orderReturnPath, withPaymentCancelled } from "@/lib/paystack-return";
import { limitByIp, limitByIpAndEmail, rateLimitMessage } from "@/lib/rate-limit";
import { createOrderNumber, createToken } from "@/lib/tokens";

const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(99),
      unitPrice: z.number().int().nonnegative().optional(),
    }),
  )
  .min(1)
  .max(50);

const MAX_SAFE_ORDER_KOBO = 2_000_000_000;

export async function createCheckout(
  items: { productId: string; quantity: number; unitPrice?: number }[],
  input: unknown,
) {
  const human = await assertHumanRequest();
  if (!human.ok) return { error: human.error };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: "Please complete the delivery details." };
  if (!Array.isArray(items) || items.length === 0) return { error: "Your bag is empty." };

  const parsedItems = checkoutItemsSchema.safeParse(items);
  if (!parsedItems.success) {
    return { error: "Choose a valid quantity for each product." };
  }

  // Merge duplicate productIds so combined quantities cannot bypass stock checks.
  const merged = new Map<string, { productId: string; quantity: number; unitPrice?: number }>();
  for (const item of parsedItems.data) {
    const existing = merged.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(item.productId, { ...item });
    }
  }
  const normalizedItems = [...merged.values()];

  const requestHeaders = await headers();
  const limited = await limitByIpAndEmail(requestHeaders, "checkout", parsed.data.email, "checkout");
  if (!limited.ok) {
    return { error: rateLimitMessage(limited.retryAfterSec) };
  }

  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Checkout needs the Neon database. Add DATABASE_URL and load the catalogue in admin." };
  }

  if (parsed.data.fulfillment === "DELIVERY") {
    if (!parsed.data.zoneSlug) return { error: "Choose a delivery zone." };
    if (!parsed.data.addressLine1) return { error: "Add a delivery address." };
  }

  const ids = normalizedItems.map((item) => item.productId);
  const [products, existingZone, profile] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids }, isActive: true } }),
    parsed.data.fulfillment === "DELIVERY" && parsed.data.zoneSlug
      ? prisma.deliveryZone.findUnique({ where: { slug: parsed.data.zoneSlug } })
      : Promise.resolve(null),
    getSessionProfile(),
  ]);

  const productById = new Map(products.map((entry) => [entry.id, entry]));
  const lines = [];
  const priceUpdates: Record<string, number> = {};

  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product) {
      return { error: "A product in your bag is no longer for sale. Remove it and add it again." };
    }
    if (product.stock < item.quantity) {
      return { error: `${product.name} only has ${product.stock} left.` };
    }
    if (
      typeof item.unitPrice === "number" &&
      Number.isFinite(item.unitPrice) &&
      item.unitPrice !== product.price
    ) {
      priceUpdates[product.id] = product.price;
    }
    lines.push({ product, quantity: item.quantity });
  }

  if (Object.keys(priceUpdates).length > 0) {
    return {
      error: "Some prices changed. Please review your bag.",
      prices: priceUpdates,
    };
  }

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  let deliveryFee = 0;
  let zoneId: string | undefined;

  if (parsed.data.fulfillment === "DELIVERY") {
    const catalogZone = deliveryZones.find((entry) => entry.slug === parsed.data.zoneSlug);
    const zone =
      existingZone ??
      (catalogZone
        ? await prisma.deliveryZone.create({
            data: {
              name: catalogZone.name,
              slug: catalogZone.slug,
              fee: catalogZone.fee,
              eta: catalogZone.eta,
            },
          })
        : null);
    if (!zone || !zone.isActive) return { error: "Choose a delivery zone." };
    deliveryFee = zone.fee;
    zoneId = zone.id;
  }

  const total = subtotal + deliveryFee;
  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_SAFE_ORDER_KOBO) {
    return { error: "Order total exceeds the maximum allowed online amount. Please contact us." };
  }

  const user = await attachCustomer(profile);
  const accessToken = createToken();
  const orderNumber = createOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      accessToken,
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      fulfillment: parsed.data.fulfillment,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2,
      city: parsed.data.city,
      notes: parsed.data.notes,
      deliveryZone: zoneId ? { connect: { id: zoneId } } : undefined,
      user,
      items: {
        create: lines.map((line) => ({
          name: line.product.name,
          unitPrice: line.product.price,
          quantity: line.quantity,
          productId: line.product.id,
        })),
      },
    },
  });

  const checkoutReturnUrl = orderPaystackReturnUrl(accessToken);

  if (!hasPaystack()) {
    return { token: accessToken, returnPath: orderReturnPath(accessToken) };
  }

  const payLimit = await limitByIpAndEmail(
    requestHeaders,
    "paystack",
    parsed.data.email,
    "paystackInit",
  );
  if (!payLimit.ok) {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
    return { error: rateLimitMessage(payLimit.retryAfterSec) };
  }

  const reference = nextPaystackReference("ord", order.id);

  try {
    const payment = await initializePaystack({
      email: parsed.data.email,
      amount: order.total,
      reference,
      callbackUrl: checkoutReturnUrl,
      cancelUrl: withPaymentCancelled(checkoutReturnUrl),
      metadata: { purpose: "ORDER", orderId: order.id },
    });

    await prisma.payment.create({
      data: {
        purpose: "ORDER",
        amount: order.total,
        paystackReference: reference,
        paystackAccessCode: payment.access_code,
        orderId: order.id,
      },
    });

    return {
      token: accessToken,
      accessCode: payment.access_code,
      authorizationUrl: payment.authorization_url,
      reference,
      returnPath: orderReturnPath(accessToken),
    };
  } catch (error) {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
    return {
      error: error instanceof Error ? error.message : "Paystack could not start the payment.",
    };
  }
}

export async function resumeOrderPayment(token: string) {
  const human = await assertHumanRequest();
  if (!human.ok) return { error: human.error };

  if (!token || !/^[a-f0-9]{48}$/i.test(token)) return { error: "Order not found." as const };

  const requestHeaders = await headers();
  const ipLimited = await limitByIp(requestHeaders, "paystack-resume", "paystackInit");
  if (!ipLimited.ok) {
    return { error: rateLimitMessage(ipLimited.retryAfterSec) };
  }

  const prisma = await tryPrisma();
  if (!prisma) return { error: "Checkout needs the database." as const };
  if (!hasPaystack()) return { error: "Online payments are not configured yet." as const };

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      payment: true,
      items: {
        include: { product: { select: { id: true, name: true, isActive: true, stock: true } } },
      },
    },
  });
  if (!order) return { error: "Order not found." as const };

  const limited = await limitByIpAndEmail(requestHeaders, "paystack", order.email, "paystackInit");
  if (!limited.ok) {
    return { error: rateLimitMessage(limited.retryAfterSec) };
  }
  if (order.status === "CANCELLED") {
    return { error: "This order was cancelled." as const };
  }
  if (order.status === "PAID" || order.payment?.status === "PAID") {
    return { error: "This order is already paid." as const };
  }

  // Re-verify active status and stock before re-initiating payment.
  for (const item of order.items) {
    if (!item.product || !item.product.isActive) {
      return { error: `${item.name} is no longer available. Please start a new order.` as const };
    }
    if (item.product.stock < item.quantity) {
      return {
        error: `${item.product.name} only has ${item.product.stock} left. Please update your bag.` as const,
      };
    }
  }

  if (order.payment?.paystackReference) {
    const existing = await verifyAndSettleExistingReference(order.payment.paystackReference);
    if (existing.settled) {
      return { error: "This order is already paid." as const };
    }
  }

  const reference = nextPaystackReference("ord", order.id);
  const checkoutReturnUrl = orderPaystackReturnUrl(token);

  try {
    const payment = await initializePaystack({
      email: order.email,
      amount: order.total,
      reference,
      callbackUrl: checkoutReturnUrl,
      cancelUrl: withPaymentCancelled(checkoutReturnUrl),
      metadata: { purpose: "ORDER", orderId: order.id },
    });

    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          paystackReference: reference,
          paystackAccessCode: payment.access_code,
          status: "PENDING",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          purpose: "ORDER",
          amount: order.total,
          paystackReference: reference,
          paystackAccessCode: payment.access_code,
          orderId: order.id,
        },
      });
    }

    return {
      token,
      accessCode: payment.access_code,
      authorizationUrl: payment.authorization_url,
      reference,
      returnPath: orderReturnPath(token),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not open Paystack.",
    };
  }
}
