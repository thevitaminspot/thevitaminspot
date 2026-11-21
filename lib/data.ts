import { cacheLife, cacheTag } from "next/cache";
import {
  categories,
  deliveryZones,
  infusions,
  products,
  relatedProducts,
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

const FALLBACK_CACHE_LIFE = { stale: 300, revalidate: 15, expire: 300 } as const;

async function fetchActiveProducts() {
  const prisma = await tryPrisma();
  if (!prisma) return { data: products, fallback: false };

  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { position: "asc" } }, category: true },
      orderBy: { name: "asc" },
    });

    return {
      data: rows.length === 0 ? products : rows.map(mapProduct),
      fallback: false,
    };
  } catch {
    console.warn("[data:products] Neon unreachable; using static fallback catalog.");
    return { data: products, fallback: true };
  }
}

export async function listProducts() {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  const result = await fetchActiveProducts();
  if (result.fallback) {
    cacheLife(FALLBACK_CACHE_LIFE);
  } else {
    cacheLife("hours");
  }
  return result.data;
}

/** Derived from listProducts — do not add "use cache" here (nested cache + outer memoization hangs). */
export async function listFeaturedProducts() {
  return (await listProducts()).filter((product) => product.featured);
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
  const fallbackInfusions = infusions.filter((item) => item.isActive !== false);
  const prisma = await tryPrisma();
  if (!prisma) return { data: fallbackInfusions, fallback: false };

  try {
    const rows = await prisma.infusionService.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    if (rows.length === 0) return { data: fallbackInfusions, fallback: false };

    return {
      data: rows.map((row) => ({
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
      })),
      fallback: false,
    };
  } catch {
    console.warn("[data:infusions] Neon unreachable; using static fallback infusions.");
    return { data: fallbackInfusions, fallback: true };
  }
}

export async function listInfusions() {
  "use cache";
  cacheTag(CACHE_TAGS.infusions);
  const result = await fetchActiveInfusions();
  if (result.fallback) {
    cacheLife(FALLBACK_CACHE_LIFE);
  } else {
    cacheLife("hours");
  }
  return result.data;
}

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

export async function listZones() {
  "use cache";
  cacheTag(CACHE_TAGS.zones);
  const prisma = await tryPrisma();
  if (!prisma) {
    cacheLife("hours");
    return deliveryZones;
  }

  try {
    const rows = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { fee: "asc" },
    });
    cacheLife("hours");
    return rows.length === 0 ? deliveryZones : rows;
  } catch {
    cacheLife(FALLBACK_CACHE_LIFE);
    console.warn("[data:zones] Neon unreachable; using static fallback zones.");
    return deliveryZones;
  }
}

export async function listCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  const prisma = await tryPrisma();
  if (!prisma) {
    cacheLife("hours");
    return categories;
  }

  try {
    const rows = await prisma.productCategory.findMany({
      orderBy: { name: "asc" },
    });
    cacheLife("hours");
    return rows.length === 0
      ? categories
      : rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? "",
        }));
  } catch {
    cacheLife(FALLBACK_CACHE_LIFE);
    console.warn("[data:categories] Neon unreachable; using static fallback categories.");
    return categories;
  }
}

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
