"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAdminUser } from "@/lib/admin";
import { categories, type CatalogInfusion, type CatalogProduct } from "@/lib/catalog";
import { tryPrisma } from "@/lib/db";
import {
  readLocalAppointments,
  updateLocalAppointment,
  withInfusions,
  withProducts,
} from "@/lib/local-store";
import { nairaToKobo } from "@/lib/money";
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
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/infusions");
  revalidatePath("/infusions");
  if (slug) revalidatePath(`/shop/${slug}`);
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function guard() {
  const admin = await getAdminUser();
  if (!admin) return { error: "Forbidden" as const };
  return null;
}

function knownCategory(slug: string) {
  return categories.find((item) => item.slug === slug) ?? null;
}

export async function updateProduct(input: {
  id: string;
  name: string;
  priceNaira: number;
  stock: number;
  tagline: string;
  description: string;
  benefits: string;
  ingredients: string;
  usage: string;
  featured: boolean;
  categorySlug: string;
  images: { url: string; alt: string }[];
}) {
  const denied = await guard();
  if (denied) return denied;
  const name = input.name.trim();
  if (name.length < 2) return { error: "Name is too short." };
  if (!Number.isFinite(input.priceNaira) || input.priceNaira < 0) {
    return { error: "Enter a price in naira." };
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { error: "Stock must be a whole number." };
  }
  const images = input.images.filter((image) => image.url.trim());
  if (images.length === 0) return { error: "Add at least one picture." };
  const category = knownCategory(input.categorySlug);
  if (!category) return { error: "Pick a category." };
  const benefits = lines(input.benefits);
  const ingredients = lines(input.ingredients);
  const usage = input.usage.trim();
  const tagline = input.tagline.trim();
  const description = input.description.trim();

  const prisma = await tryPrisma();
  if (prisma) {
    const existing = await prisma.product.findUnique({ where: { id: input.id } });
    if (existing) {
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
          tagline,
          description,
          usage,
          benefits,
          ingredients,
          featured: input.featured,
          categoryId: categoryRow.id,
          price: nairaToKobo(input.priceNaira),
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
  }

  let slug = "";
  const result = await withProducts((rows) => {
    const index = rows.findIndex((row) => row.id === input.id);
    if (index < 0) return { error: "Product not found." };
    slug = rows[index].slug;
    rows[index] = {
      ...rows[index],
      name,
      tagline,
      description,
      usage,
      benefits,
      ingredients,
      featured: input.featured,
      categorySlug: category.slug,
      price: nairaToKobo(input.priceNaira),
      stock: input.stock,
      images: images.map((image) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || name,
      })),
    };
    return rows;
  });
  if ("ok" in result) refreshShop(slug);
  return result;
}

export async function uploadProductImage(formData: FormData) {
  const denied = await guard();
  if (denied) return denied;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (!file.type.startsWith("image/")) return { error: "That file is not an image." };
  if (file.size > 8_000_000) return { error: "Image must be under 8MB." };
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${Date.now().toString(36)}.${ext}`;
  const dir = path.join(process.cwd(), "public/images/uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/images/uploads/${filename}` };
}

export async function createProduct(input: {
  name: string;
  priceNaira: number;
  stock: number;
  tagline: string;
  description: string;
  benefits: string;
  ingredients: string;
  usage: string;
  featured: boolean;
  categorySlug: string;
  images: { url: string; alt: string }[];
}) {
  const denied = await guard();
  if (denied) return denied;
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
  const tagline = input.tagline.trim();
  const description = input.description.trim() || tagline || name;
  const benefits = lines(input.benefits);
  const ingredients = lines(input.ingredients);
  const usage = input.usage.trim();

  const slugBase = slugify(name);
  const prisma = await tryPrisma();
  if (prisma) {
    const categoryRow =
      (await prisma.productCategory.findUnique({ where: { slug: category.slug } })) ??
      (await prisma.productCategory.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
      }));
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    await prisma.product.create({
      data: {
        name,
        slug,
        tagline,
        description,
        benefits,
        ingredients,
        usage,
        featured: input.featured,
        price: nairaToKobo(input.priceNaira),
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

  const result = await withProducts((rows) => {
    let slug = slugBase;
    if (rows.some((row) => row.slug === slug)) slug = `${slugBase}-${rows.length + 1}`;
    const product: CatalogProduct = {
      id: `prod-${Date.now().toString(36)}`,
      name,
      slug,
      tagline,
      description,
      benefits,
      ingredients,
      usage,
      price: nairaToKobo(input.priceNaira),
      sku: slug.toUpperCase(),
      stock: input.stock,
      featured: input.featured,
      categorySlug: category.slug,
      images: images.map((image) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || name,
      })),
    };
    return [product, ...rows];
  });
  if ("ok" in result) refreshShop();
  return result;
}

export async function deleteProduct(id: string) {
  const denied = await guard();
  if (denied) return denied;

  const prisma = await tryPrisma();
  if (prisma) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (existing) {
      await prisma.product.delete({ where: { id } });
      refreshShop();
      return { ok: true as const };
    }
  }

  const result = await withProducts((rows) => {
    const next = rows.filter((row) => row.id !== id);
    if (next.length === rows.length) return { error: "Product not found." };
    return next;
  });
  if ("ok" in result) refreshShop();
  return result;
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
  if (!Number.isFinite(input.depositNaira) || input.depositNaira < 0) {
    return { error: "Enter a deposit in naira." as const };
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
  const denied = await guard();
  if (denied) return denied;
  const fields = readInfusion(input);
  if ("error" in fields) return fields;

  const prisma = await tryPrisma();
  if (prisma) {
    const existing = await prisma.infusionService.findUnique({ where: { id: input.id } });
    if (existing) {
      await prisma.infusionService.update({
        where: { id: input.id },
        data: fields,
      });
      refreshShop();
      return { ok: true as const };
    }
  }

  const result = await withInfusions((rows) => {
    const index = rows.findIndex((row) => row.id === input.id);
    if (index < 0) return { error: "Infusion not found." };
    rows[index] = { ...rows[index], ...fields };
    return rows;
  });
  if ("ok" in result) refreshShop();
  return result;
}

export async function createInfusion(input: InfusionInput) {
  const denied = await guard();
  if (denied) return denied;
  const fields = readInfusion(input);
  if ("error" in fields) return fields;

  const slugBase = slugify(fields.name);
  const prisma = await tryPrisma();
  if (prisma) {
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    await prisma.infusionService.create({
      data: { ...fields, slug, isActive: true },
    });
    refreshShop();
    return { ok: true as const };
  }

  const result = await withInfusions((rows) => {
    let slug = slugBase;
    if (rows.some((row) => row.slug === slug)) slug = `${slugBase}-${rows.length + 1}`;
    const infusion: CatalogInfusion = {
      id: `drip-${Date.now().toString(36)}`,
      slug,
      featured: false,
      isActive: true,
      ...fields,
    };
    return [infusion, ...rows];
  });
  if ("ok" in result) refreshShop();
  return result;
}

export async function deleteInfusion(id: string) {
  const denied = await guard();
  if (denied) return denied;

  const prisma = await tryPrisma();
  if (prisma) {
    const existing = await prisma.infusionService.findUnique({ where: { id } });
    if (existing) {
      try {
        await prisma.infusionService.delete({ where: { id } });
      } catch {
        await prisma.infusionService.update({ where: { id }, data: { isActive: false } });
      }
      refreshShop();
      return { ok: true as const };
    }
  }

  const result = await withInfusions((rows) => {
    const next = rows.filter((row) => row.id !== id);
    if (next.length === rows.length) return { error: "Infusion not found." };
    return next;
  });
  if ("ok" in result) refreshShop();
  return result;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const denied = await guard();
  if (denied) return denied;
  const prisma = await tryPrisma();
  if (!prisma) return { error: "Database is not configured." };
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const denied = await guard();
  if (denied) return denied;
  const prisma = await tryPrisma();
  if (prisma) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (existing) {
      await prisma.appointment.update({ where: { id }, data: { status } });
      revalidatePath("/admin/appointments");
      return { ok: true as const };
    }
  }

  const updated = await updateLocalAppointment(id, { status });
  if (!updated) return { error: "Appointment not found." };
  revalidatePath("/admin/appointments");
  return { ok: true as const };
}

export async function acceptAppointment(id: string) {
  return updateAppointmentStatus(id, "CONFIRMED");
}

export async function listAdminAppointments() {
  const denied = await guard();
  if (denied) return [];
  const prisma = await tryPrisma();
  if (prisma) {
    const rows = await prisma.appointment.findMany({
      include: { service: true },
      orderBy: { startsAt: "asc" },
      take: 50,
    });
    if (rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        startsAt: row.startsAt.toISOString(),
        name: row.name,
        email: row.email,
        status: row.status,
        serviceName: row.service.name,
      }));
    }
  }

  const local = await readLocalAppointments();
  return local
    .slice()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((row) => ({
      id: row.id,
      startsAt: row.startsAt,
      name: row.name,
      email: row.email,
      status: row.status,
      serviceName: row.serviceName,
    }));
}

export async function blockDate(date: string, reason?: string) {
  const denied = await guard();
  if (denied) return denied;
  const prisma = await tryPrisma();
  if (!prisma) return { error: "Database is not configured." };
  await prisma.blockedDate.upsert({
    where: { date: new Date(date) },
    update: { reason },
    create: { date: new Date(date), reason },
  });
  return { ok: true as const };
}
