"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { canTransitionOrder } from "@/lib/admin-orders";
import { getAdminProfile } from "@/lib/auth";
import { PRODUCT_MAX_IMAGES, categories } from "@/lib/catalog";
import { tryPrisma } from "@/lib/db";
import {
  notifyAdminBookingCancelled,
  notifyBookingCancelled,
  notifyBookingConfirmed,
} from "@/lib/booking-notify";
import { sendOrderUpdate } from "@/lib/email";
import { uploadImage } from "@/lib/images";
import { nairaToKobo } from "@/lib/money";
import { seedCatalog } from "@/lib/seed-catalog";
import { site } from "@/lib/site";
import type { AppointmentStatus, OrderStatus } from "@/lib/generated/prisma/client";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "item";
}

function refreshShop(slug?: string) {
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.categories, "max");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/infusions");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/zones");
  revalidatePath("/infusions");
  if (slug) revalidatePath(`/shop/${slug}`);
}

function refreshInfusions() {
  revalidateTag(CACHE_TAGS.infusions, "max");
  revalidatePath("/infusions");
  revalidatePath("/admin/infusions");
  revalidatePath("/book");
}

function refreshZones() {
  revalidateTag(CACHE_TAGS.zones, "max");
  revalidatePath("/admin/zones");
  revalidatePath("/checkout");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function guard() {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Sign in with an admin account." as const };
  return null;
}

async function database() {
  const denied = await guard();
  if (denied) return denied;
  const prisma = await tryPrisma();
  if (!prisma) {
    return { error: "Connect Neon with DATABASE_URL before saving." as const };
  }
  return prisma;
}

function knownCategory(slug: string) {
  return categories.find((item) => item.slug === slug) ?? null;
}

export async function seedCatalogue() {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const result = await seedCatalog(prisma);
  refreshShop();
  revalidatePath("/admin/appointments");
  return { ok: true as const, created: result.created };
}

export async function updateProduct(input: {
  id: string;
  name: string;
  priceNaira: number;
  compareAtPriceNaira?: number;
  stock: number;
  tagline: string;
  description: string;
  benefits: string;
  ingredients: string;
  usage: string;
  featured: boolean;
  isActive?: boolean;
  categorySlug: string;
  images: { url: string; alt: string }[];
}) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const name = input.name.trim();
  if (name.length < 2) return { error: "Name is too short." };
  if (!Number.isFinite(input.priceNaira) || input.priceNaira <= 0) {
    return { error: "Enter a price in naira." };
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { error: "Stock must be a whole number." };
  }
  const images = input.images.filter((image) => image.url.trim());
  if (images.length === 0) return { error: "Add at least one picture." };
  if (images.length > PRODUCT_MAX_IMAGES) {
    return { error: `Up to ${PRODUCT_MAX_IMAGES} pictures per product.` };
  }
  const category = knownCategory(input.categorySlug);
  if (!category) return { error: "Pick a category." };

  const existing = await prisma.product.findUnique({ where: { id: input.id } });
  if (!existing) return { error: "Product not found." };

  const categoryRow =
    (await prisma.productCategory.findUnique({ where: { slug: category.slug } })) ??
    (await prisma.productCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    }));

  await prisma.product.update({
    where: { id: input.id },
    data: {
      name,
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      usage: input.usage.trim(),
      benefits: lines(input.benefits),
      ingredients: lines(input.ingredients),
      featured: input.featured,
      isActive: input.isActive ?? existing.isActive,
      categoryId: categoryRow.id,
      price: nairaToKobo(input.priceNaira),
      compareAtPrice: input.compareAtPriceNaira ? nairaToKobo(input.compareAtPriceNaira) : null,
      stock: input.stock,
      images: {
        deleteMany: {},
        create: images.map((image, position) => ({
          url: image.url.trim(),
          alt: image.alt.trim() || name,
          position,
        })),
      },
    },
  });
  refreshShop(existing.slug);
  return { ok: true as const };
}

export async function uploadProductImage(formData: FormData) {
  const denied = await guard();
  if (denied) return denied;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  return uploadImage(file);
}

export async function createProduct(input: {
  name: string;
  priceNaira: number;
  compareAtPriceNaira?: number;
  stock: number;
  tagline: string;
  description: string;
  benefits: string;
  ingredients: string;
  usage: string;
  featured: boolean;
  isActive?: boolean;
  categorySlug: string;
  images: { url: string; alt: string }[];
}) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const name = input.name.trim();
  if (name.length < 2) return { error: "Name is too short." };
  if (!Number.isFinite(input.priceNaira) || input.priceNaira <= 0) {
    return { error: "Enter a price in naira." };
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { error: "Stock must be a whole number." };
  }
  const category = knownCategory(input.categorySlug);
  if (!category) return { error: "Pick a category." };
  const images = input.images.filter((image) => image.url.trim());
  if (images.length === 0) return { error: "Add at least one picture." };
  if (images.length > PRODUCT_MAX_IMAGES) {
    return { error: `Up to ${PRODUCT_MAX_IMAGES} pictures per product.` };
  }

  const categoryRow =
    (await prisma.productCategory.findUnique({ where: { slug: category.slug } })) ??
    (await prisma.productCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    }));
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  await prisma.product.create({
    data: {
      name,
      slug,
      tagline: input.tagline.trim(),
      description: input.description.trim() || input.tagline.trim() || name,
      benefits: lines(input.benefits),
      ingredients: lines(input.ingredients),
      usage: input.usage.trim(),
      featured: input.featured,
      isActive: input.isActive ?? true,
      price: nairaToKobo(input.priceNaira),
      compareAtPrice: input.compareAtPriceNaira ? nairaToKobo(input.compareAtPriceNaira) : null,
      stock: input.stock,
      sku: slug.toUpperCase(),
      categoryId: categoryRow.id,
      images: {
        create: images.map((image, position) => ({
          url: image.url.trim(),
          alt: image.alt.trim() || name,
          position,
        })),
      },
    },
  });
  refreshShop();
  return { ok: true as const };
}

export async function updateProductStock(id: string, newStock: number) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  if (!Number.isInteger(newStock) || newStock < 0) {
    return { error: "Stock must be a positive integer." };
  }
  await prisma.product.update({
    where: { id },
    data: { stock: newStock },
  });
  refreshShop();
  return { ok: true as const };
}

export async function toggleProductActive(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "Product not found." };
  await prisma.product.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  refreshShop(existing.slug);
  return { ok: true as const, isActive: !existing.isActive };
}

export async function deleteProduct(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "Product not found." };
  const sold = await prisma.orderItem.count({ where: { productId: id } });
  if (sold > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false, stock: 0 } });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  refreshShop(existing.slug);
  return { ok: true as const };
}

type InfusionInput = {
  name: string;
  tagline: string;
  description: string;
  benefits: string;
  ingredients: string;
  priceNaira: number;
  depositNaira: number;
  durationMin: number;
  image: string;
};

function readInfusion(input: InfusionInput) {
  const name = input.name.trim();
  if (name.length < 2) return { error: "Name is too short." as const };
  if (!Number.isFinite(input.priceNaira) || input.priceNaira < 0) {
    return { error: "Enter a price in naira." as const };
  }
  if (!Number.isFinite(input.depositNaira) || input.depositNaira <= 0) {
    return { error: "Enter a booking fee in naira (required for online booking)." as const };
  }
  if (!Number.isInteger(input.durationMin) || input.durationMin < 15) {
    return { error: "Duration must be at least 15 minutes." as const };
  }
  const image = input.image.trim();
  if (!image) return { error: "Add a picture." as const };
  return {
    name,
    tagline: input.tagline.trim(),
    description: input.description.trim() || input.tagline.trim() || name,
    benefits: lines(input.benefits),
    ingredients: lines(input.ingredients),
    price: nairaToKobo(input.priceNaira),
    deposit: nairaToKobo(input.depositNaira),
    durationMin: input.durationMin,
    image,
  };
}

export async function updateInfusion(input: InfusionInput & { id: string }) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const fields = readInfusion(input);
  if ("error" in fields) return fields;
  const existing = await prisma.infusionService.findUnique({ where: { id: input.id } });
  if (!existing) return { error: "Infusion not found." };
  await prisma.infusionService.update({ where: { id: input.id }, data: fields });
  refreshInfusions();
  return { ok: true as const };
}

export async function createInfusion(input: InfusionInput) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const fields = readInfusion(input);
  if ("error" in fields) return fields;
  const slug = `${slugify(fields.name)}-${Date.now().toString(36)}`;
  await prisma.infusionService.create({
    data: { ...fields, slug, isActive: true },
  });
  refreshInfusions();
  return { ok: true as const };
}

export async function toggleInfusionActive(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const existing = await prisma.infusionService.findUnique({ where: { id } });
  if (!existing) return { error: "Infusion not found." };
  await prisma.infusionService.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  refreshInfusions();
  return { ok: true as const, isActive: !existing.isActive };
}

export async function deleteInfusion(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const existing = await prisma.infusionService.findUnique({ where: { id } });
  if (!existing) return { error: "Infusion not found." };
  const booked = await prisma.appointment.count({ where: { serviceId: id } });
  if (booked > 0) {
    await prisma.infusionService.update({ where: { id }, data: { isActive: false } });
    refreshInfusions();
    return { ok: true as const, mode: "hidden" as const, bookings: booked };
  }
  await prisma.infusionService.delete({ where: { id } });
  refreshInfusions();
  return { ok: true as const, mode: "deleted" as const };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const current = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!current) return { error: "Order not found." };
  if (
    !canTransitionOrder(
      current.status,
      status,
      current.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY",
    )
  ) {
    return { error: "That status change is not allowed." };
  }

  const restoreStock =
    status === "CANCELLED" &&
    (current.status === "PAID" || current.status === "PACKED") &&
    !current.notes?.includes("stock ran short");

  const order = restoreStock
    ? await prisma.$transaction(async (tx) => {
        for (const item of current.items) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return tx.order.update({ where: { id }, data: { status } });
      })
    : await prisma.order.update({ where: { id }, data: { status } });
  await sendOrderUpdate({
    to: order.email,
    name: order.name,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    trackUrl: `${site.url}/orders/${order.accessToken}`,
    fulfillment: order.fulfillment,
  }).catch(() => undefined);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true as const };
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true, payment: true },
  });
  if (!existing) return { error: "Appointment not found." };
  const allowed: Record<string, AppointmentStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };
  if (!allowed[existing.status]?.includes(status)) {
    return { error: "That status change is not allowed." };
  }
  const manageUrl = `${site.url}/appointments/${existing.accessToken}`;
  const depositPaid =
    existing.payment?.status === "PAID" ? existing.payment.amount : undefined;
  const depositDue =
    existing.service.deposit > 0 && existing.payment?.status !== "PAID"
      ? existing.service.deposit
      : undefined;
  await prisma.appointment.update({ where: { id }, data: { status } });

  if (status === "CONFIRMED" && existing.status !== "CONFIRMED") {
    await notifyBookingConfirmed({
      to: existing.email,
      name: existing.name,
      serviceName: existing.service.name,
      startsAt: existing.startsAt,
      manageUrl,
      depositPaid,
      depositDue,
      sessionPrice: existing.service.price,
    }).catch(() => undefined);
  } else if (status === "CANCELLED" && existing.status !== "CANCELLED") {
    await notifyBookingCancelled({
      to: existing.email,
      name: existing.name,
      serviceName: existing.service.name,
      startsAt: existing.startsAt,
      manageUrl,
      reason: "Cancelled by The Vitamin Spot",
      depositPaid,
    }).catch(() => undefined);

    await notifyAdminBookingCancelled({
      name: existing.name,
      email: existing.email,
      serviceName: existing.service.name,
      startsAt: existing.startsAt,
      reason: "Cancelled by admin",
      depositPaid,
      cancelledBy: "admin",
    }).catch(() => undefined);
  }
  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function acceptAppointment(id: string) {
  return updateAppointmentStatus(id, "CONFIRMED");
}

export async function listAdminAppointments() {
  const admin = await getAdminProfile();
  if (!admin) return [];
  const prisma = await tryPrisma();
  if (!prisma) return [];
  const rows = await prisma.appointment.findMany({
    include: { service: true, payment: true },
    orderBy: { startsAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    serviceName: row.service.name,
    deposit: row.service.deposit,
    sessionPrice: row.service.price,
    depositPaid: row.payment?.status === "PAID" ? row.payment.amount : null,
  }));
}

export async function blockDate(date: string, reason?: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  await prisma.blockedDate.upsert({
    where: { date: new Date(date) },
    update: { reason },
    create: { date: new Date(date), reason },
  });
  revalidatePath("/admin/availability");
  return { ok: true as const };
}

export async function unblockDate(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  await prisma.blockedDate.delete({ where: { id } });
  revalidatePath("/admin/availability");
  return { ok: true as const };
}

export type WeeklyHoursInput = {
  weekday: number;
  closed: boolean;
  startHour: number;
  endHour: number;
  slotMin: number;
  bufferMin: number;
};

export async function saveWeeklyHours(rules: WeeklyHoursInput[]) {
  const prisma = await database();
  if ("error" in prisma) return prisma;

  const next = rules
    .filter((rule) => !rule.closed)
    .map((rule) => {
      const startMin = Math.round(rule.startHour) * 60;
      const endMin = Math.round(rule.endHour) * 60;
      const slotMin = Math.max(15, Math.round(rule.slotMin) || 45);
      const bufferMin = Math.max(0, Math.round(rule.bufferMin) || 0);
      return {
        weekday: rule.weekday,
        startMin,
        endMin,
        slotMin,
        bufferMin,
        isActive: true,
      };
    });

  for (const rule of next) {
    if (rule.weekday < 0 || rule.weekday > 6) {
      return { error: "Weekday must be Sunday–Saturday." };
    }
    if (rule.endMin <= rule.startMin) {
      return { error: "End time must be after start time for open days." };
    }
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany(),
    ...(next.length > 0
      ? [
          prisma.availabilityRule.createMany({
            data: next,
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/availability");
  revalidatePath("/infusions");
  revalidatePath("/book");
  return { ok: true as const };
}

export async function updateZone(input: { id: string; feeNaira: number; eta: string; isActive: boolean }) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  if (!Number.isFinite(input.feeNaira) || input.feeNaira < 0) {
    return { error: "Enter a delivery fee in naira." };
  }
  await prisma.deliveryZone.update({
    where: { id: input.id },
    data: {
      fee: nairaToKobo(input.feeNaira),
      eta: input.eta.trim() || "Same day",
      isActive: input.isActive,
    },
  });
  refreshZones();
  return { ok: true as const };
}

export async function createZone(input: { name: string; feeNaira: number; eta: string; isActive: boolean }) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const name = input.name.trim();
  if (name.length < 2) return { error: "Zone name is required." };
  if (!Number.isFinite(input.feeNaira) || input.feeNaira < 0) {
    return { error: "Enter a delivery fee in naira." };
  }
  const slug = slugify(name);
  const existing = await prisma.deliveryZone.findUnique({ where: { slug } });
  if (existing) return { error: "A delivery zone with this name already exists." };

  await prisma.deliveryZone.create({
    data: {
      name,
      slug,
      fee: nairaToKobo(input.feeNaira),
      eta: input.eta.trim() || "Same day delivery",
      isActive: input.isActive,
    },
  });
  refreshZones();
  return { ok: true as const };
}

export async function deleteZone(id: string) {
  const prisma = await database();
  if ("error" in prisma) return prisma;
  const used = await prisma.order.count({ where: { deliveryZoneId: id } });
  if (used > 0) {
    await prisma.deliveryZone.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.deliveryZone.delete({ where: { id } });
  }
  refreshZones();
  return { ok: true as const };
}
