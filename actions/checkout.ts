"use server";

import { headers } from "next/headers";
import { products } from "@/lib/catalog";
import { deliveryZones } from "@/lib/catalog";
import { checkoutSchema } from "@/lib/env";
import { tryPrisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { hasPaystack } from "@/lib/env";
import { initializePaystack } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { getSessionUser } from "@/lib/supabase/server";
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

  const lines = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) throw new Error("Unknown product");
    return { product, quantity: item.quantity };
  });

  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );

  let deliveryFee = 0;
  if (parsed.data.fulfillment === "DELIVERY") {
    const zone = deliveryZones.find((entry) => entry.slug === parsed.data.zoneSlug);
    if (!zone) return { error: "Choose a delivery zone." };
    if (!parsed.data.addressLine1) return { error: "Add a delivery address." };
    deliveryFee = zone.fee;
  }

  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Checkout needs a configured database. Add DATABASE_URL and migrate." };
  }

  const user = await getSessionUser();
  const accessToken = createToken();
  const orderNumber = createOrderNumber();
  const zone = deliveryZones.find((entry) => entry.slug === parsed.data.zoneSlug);

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
      deliveryZone: zone
        ? {
            connectOrCreate: {
              where: { slug: zone.slug },
              create: zone,
            },
          }
        : undefined,
      items: {
        create: lines.map((line) => ({
          name: line.product.name,
          unitPrice: line.product.price,
          quantity: line.quantity,
          product: {
            connectOrCreate: {
              where: { slug: line.product.slug },
              create: {
                name: line.product.name,
                slug: line.product.slug,
                tagline: line.product.tagline,
                description: line.product.description,
                benefits: line.product.benefits,
                ingredients: line.product.ingredients,
                usage: line.product.usage,
                price: line.product.price,
                sku: line.product.sku,
                stock: line.product.stock,
                featured: line.product.featured,
                category: {
                  connectOrCreate: {
                    where: { slug: line.product.categorySlug },
                    create: {
                      name: line.product.categorySlug,
                      slug: line.product.categorySlug,
                    },
                  },
                },
                images: {
                  create: line.product.images.map((image, position) => ({
                    url: image.url,
                    alt: image.alt,
                    position,
                  })),
                },
              },
            },
          },
        })),
      },
      ...(user?.email
        ? {
            user: {
              connectOrCreate: {
                where: { email: user.email },
                create: { email: user.email, name: user.user_metadata?.name },
              },
            },
          }
        : {}),
    },
  });

  const trackUrl = `${site.url}/orders/${accessToken}`;
  await sendMail({
    to: parsed.data.email,
    subject: `Order ${orderNumber} at ${site.name}`,
    html: `<p>Dear ${parsed.data.name},</p><p>We have your order ${orderNumber}.</p><p><a href="${trackUrl}">Track it here</a></p>`,
  });

  if (!hasPaystack()) {
    return { token: accessToken };
  }

  const reference = `ord_${order.id}`;
  const payment = await initializePaystack({
    email: parsed.data.email,
    amount: order.total,
    reference,
    callbackUrl: trackUrl,
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
