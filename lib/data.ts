import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import {
  categories,
  deliveryZones,
  infusions,
  products,
  relatedProducts,
  testimonials,
} from "@/lib/catalog";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { tryPrisma } from "@/lib/db";

function mapProduct(row: {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  benefits: string[];
  ingredients: string[];
  usage: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  featured: boolean;
  isActive: boolean;
  category: { slug: string };
  images: { url: string; alt: string }[];
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline ?? "",
    description: row.description,
    benefits: row.benefits,
    ingredients: row.ingredients,
    usage: row.usage ?? "",
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    sku: row.sku ?? row.slug,
    stock: row.stock,
    featured: row.featured,
    isActive: row.isActive,
    categorySlug: row.category.slug,
    images: row.images.map((image) => ({ url: image.url, alt: image.alt })),
  };
}

async function fetchActiveProducts() {
  const prisma = await tryPrisma();
  if (!prisma) return products;

  const rows = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { orderBy: { position: "asc" } }, category: true },
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) return products;

  return rows.map(mapProduct);
}

export const listProducts = cache(async function listProducts() {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("hours");
  return fetchActiveProducts();
});

export async function getFeaturedFooterPacks() {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("hours");
  return (await listProducts())
    .filter((product) => product.featured)
    .map((product) => ({ href: `/shop/${product.slug}`, label: product.name }));
}

export async function listManagedProducts() {
  const prisma = await tryPrisma();
  if (!prisma) return null;
  const rows = await prisma.product.findMany({
    include: { images: { orderBy: { position: "asc" } }, category: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapProduct);
}

async function fetchActiveInfusions() {
  const prisma = await tryPrisma();
  if (!prisma) return infusions.filter((item) => item.isActive !== false);

  const rows = await prisma.infusionService.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) return infusions.filter((item) => item.isActive !== false);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    benefits: row.benefits,
    ingredients: row.ingredients,
    durationMin: row.durationMin,
    price: row.price,
    deposit: row.deposit,
    featured: row.featured,
    isActive: row.isActive,
    image: row.image,
  }));
}

export const listInfusions = cache(async function listInfusions() {
  "use cache";
  cacheTag(CACHE_TAGS.infusions);
  cacheLife("hours");
  return fetchActiveInfusions();
});

export async function listManagedInfusions() {
  const prisma = await tryPrisma();
  if (!prisma) return null;
  const rows = await prisma.infusionService.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    benefits: row.benefits,
    ingredients: row.ingredients,
    durationMin: row.durationMin,
    price: row.price,
    deposit: row.deposit,
    featured: row.featured,
    isActive: row.isActive,
    appointmentCount: row._count.appointments,
    image: row.image,
  }));
}

export const listTestimonials = cache(async function listTestimonials() {
  "use cache";
  cacheTag(CACHE_TAGS.testimonials);
  cacheLife("days");
  const prisma = await tryPrisma();
  if (!prisma) return testimonials;

  const rows = await prisma.testimonial.findMany({
    where: { featured: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.length === 0 ? testimonials : rows;
});

export const listZones = cache(async function listZones() {
  "use cache";
  cacheTag(CACHE_TAGS.zones);
  cacheLife("hours");
  const prisma = await tryPrisma();
  if (!prisma) return deliveryZones;

  const rows = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { fee: "asc" },
  });

  return rows.length === 0 ? deliveryZones : rows;
});

export const listCategories = cache(async function listCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  cacheLife("hours");
  const prisma = await tryPrisma();
  if (!prisma) return categories;

  const rows = await prisma.productCategory.findMany({
    orderBy: { name: "asc" },
  });

  return rows.length === 0
    ? categories
    : rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
      }));
});

export async function findProduct(slug: string) {
  const all = await listProducts();
  return all.find((product) => product.slug === slug);
}

export async function findInfusion(slug: string) {
  const all = await listInfusions();
  return all.find((infusion) => infusion.slug === slug);
}

export async function findRelated(slug: string) {
  const all = await listProducts();
  const current = all.find((product) => product.slug === slug);
  if (!current) return relatedProducts(slug);
  return all.filter((product) => product.slug !== slug).slice(0, 3);
}
