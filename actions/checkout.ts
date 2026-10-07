"use server";

import { headers } from "next/headers";
import { deliveryZones } from "@/lib/catalog";
import { attachCustomer, getSessionProfile } from "@/lib/auth";
import { checkoutSchema, hasPaystack } from "@/lib/env";
import { tryPrisma } from "@/lib/db";
import { escapeHtml, sendMail } from "@/lib/email";
import { confirmPaystackReturn } from "@/lib/payments";
import { initializePaystack } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { createOrderNumber, createToken } from "@/lib/tokens";

export async function createCheckout(
  items: { productId: string; quantity: number }[],
  input: unknown,
) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`checkout:${ip}`).ok) {
    return { error: "Please wait a moment before checking out again." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: "Please complete the delivery details." };
  if (items.length === 0) return { error: "Your bag is empty." };

  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Checkout needs the Neon database. Add DATABASE_URL and load the catalogue in admin." };
  }

  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  const lines = [];
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      return { error: "A product in your bag is no longer for sale. Remove it and add it again." };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: "Choose a quantity for each product." };
    }
    if (product.stock < item.quantity) {
      return { error: `${product.name} only has ${product.stock} left.` };
    }
    lines.push({ product, quantity: item.quantity });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  let deliveryFee = 0;
  let zoneId: string | undefined;

  if (parsed.data.fulfillment === "DELIVERY") {
    if (!parsed.data.zoneSlug) return { error: "Choose a delivery zone." };
    if (!parsed.data.addressLine1) return { error: "Add a delivery address." };
    const existing = await prisma.deliveryZone.findUnique({ where: { slug: parsed.data.zoneSlug } });
    const catalogZone = deliveryZones.find((entry) => entry.slug === parsed.data.zoneSlug);
    const zone =
      existing ??
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

  const profile = await getSessionProfile();
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

  const checkoutReturnUrl = `${site.url}/checkout?order=${accessToken}`;
  // Customer gets a confirmation after Paystack succeeds; admin alert sends now.
  await sendMail({
    to: process.env.ADMIN_EMAIL || site.email,
    subject: `New order ${orderNumber}`,
    html: `<p>${escapeHtml(parsed.data.name)} placed ${escapeHtml(orderNumber)}.</p><p><a href="${escapeHtml(`${site.url}/admin/orders/${order.id}`)}">Open it in admin</a></p>`,
  });

  if (!hasPaystack()) {
    return { token: accessToken };
  }

  const reference = `ord_${order.id}`;
  const payment = await initializePaystack({
    email: parsed.data.email,
    amount: order.total,
    reference,
    callbackUrl: checkoutReturnUrl,
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

  return { token: accessToken, checkoutUrl: payment.authorization_url };
}

export async function completeCheckoutReturn(token: string, reference: string) {
  if (!token || !reference) return { error: "Missing payment details." as const };

  await confirmPaystackReturn(reference);

  const prisma = await tryPrisma();
  if (!prisma) return { error: "Checkout needs the database." as const };

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: { payment: true },
  });
  if (!order) return { error: "Order not found." as const };

  if (order.payment?.status === "PAID" || order.status === "PAID") {
    return { ok: true as const, status: "PAID" as const, token };
  }
  if (order.payment?.status === "FAILED") {
    return { ok: true as const, status: "FAILED" as const, token };
  }
  return { ok: true as const, status: "PENDING" as const, token };
}

export async function resumeOrderPayment(token: string) {
  const prisma = await tryPrisma();
  if (!prisma) return { error: "Checkout needs the database." as const };
  if (!hasPaystack()) return { error: "Online payments are not configured yet." as const };

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: { payment: true },
  });
  if (!order) return { error: "Order not found." as const };
  if (order.status === "PAID" || order.payment?.status === "PAID") {
    return { error: "This order is already paid." as const };
  }

  const reference = order.payment?.paystackReference ?? `ord_${order.id}`;
  const checkoutReturnUrl = `${site.url}/checkout?order=${token}`;

  try {
    const payment = await initializePaystack({
      email: order.email,
      amount: order.total,
      reference,
      callbackUrl: checkoutReturnUrl,
      metadata: { purpose: "ORDER", orderId: order.id },
    });

    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
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

    return { checkoutUrl: payment.authorization_url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not open Paystack.",
    };
  }
}
