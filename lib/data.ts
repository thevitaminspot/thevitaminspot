import { cacheLife, cacheTag } from "next/cache";
import {
  categories,
  deliveryZones,
  infusions,
  products,
  relatedProducts,
  type CatalogProduct,
} from "@/lib/catalog";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { tryPrisma } from "@/lib/db";
import { REDIS_KEYS, redisGet, redisSet } from "@/lib/redis";

const FALLBACK_CACHE_LIFE = { stale: 300, revalidate: 15, expire: 300 } as const;
const CATALOG_FRESH_TTL_SEC = 30 * 60;
const CATALOG_STALE_TTL_SEC = 24 * 60 * 60;

async function mirrorCatalog(freshKey: string, staleKey: string, value: unknown) {
  await Promise.all([
    redisSet(freshKey, value, CATALOG_FRESH_TTL_SEC),
    redisSet(staleKey, value, CATALOG_STALE_TTL_SEC),
  ]);
}

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

async function fetchActiveProducts(): Promise<{ data: CatalogProduct[]; fallback: boolean }> {
  const cached = await redisGet<CatalogProduct[]>(REDIS_KEYS.products);
  if (cached && cached.length > 0) {
    return { data: cached, fallback: false };
  }

  const prisma = await tryPrisma();
  if (!prisma) return { data: products, fallback: false };

  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { position: "asc" } }, category: true },
      orderBy: { name: "asc" },
    });

    const mapped: CatalogProduct[] = rows.length === 0 ? products : rows.map(mapProduct);
    if (rows.length > 0) {
      await mirrorCatalog(REDIS_KEYS.products, REDIS_KEYS.productsStale, mapped);
    }
    return { data: mapped, fallback: false };
  } catch {
    const stale = await redisGet<CatalogProduct[]>(REDIS_KEYS.productsStale);
    if (stale && stale.length > 0) {
      console.warn("[data:products] Neon unreachable; serving Redis snapshot.");
      return { data: stale, fallback: true };
    }
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

type InfusionView = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  durationMin: number;
  price: number;
  deposit: number;
  featured: boolean;
  isActive: boolean;
  image: string;
};

async function fetchActiveInfusions(): Promise<{ data: InfusionView[]; fallback: boolean }> {
  const cached = await redisGet<InfusionView[]>(REDIS_KEYS.infusions);
  if (cached && cached.length > 0) {
    return { data: cached, fallback: false };
  }

  const fallbackInfusions = infusions
    .filter((item) => item.isActive !== false)
    .map((item) => ({ ...item, isActive: item.isActive ?? true }));
  const prisma = await tryPrisma();
  if (!prisma) return { data: fallbackInfusions, fallback: false };

  try {
    const rows = await prisma.infusionService.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    if (rows.length === 0) return { data: fallbackInfusions, fallback: false };

    const mapped: InfusionView[] = rows.map((row) => ({
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
    await mirrorCatalog(REDIS_KEYS.infusions, REDIS_KEYS.infusionsStale, mapped);
    return { data: mapped, fallback: false };
  } catch {
    const stale = await redisGet<InfusionView[]>(REDIS_KEYS.infusionsStale);
    if (stale && stale.length > 0) {
      console.warn("[data:infusions] Neon unreachable; serving Redis snapshot.");
      return { data: stale, fallback: true };
    }
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

type ZoneView = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  eta: string;
};

export async function listZones() {
  "use cache";
  cacheTag(CACHE_TAGS.zones);

  const cached = await redisGet<ZoneView[]>(REDIS_KEYS.zones);
  if (cached && cached.length > 0) {
    cacheLife("hours");
    return cached;
  }

  const prisma = await tryPrisma();
  if (!prisma) {
    cacheLife("hours");
    return deliveryZones;
  }

  try {
    const rows = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { fee: "asc" },
      select: { id: true, name: true, slug: true, fee: true, eta: true },
    });
    cacheLife("hours");
    if (rows.length > 0) {
      await mirrorCatalog(REDIS_KEYS.zones, REDIS_KEYS.zonesStale, rows);
      return rows;
    }
    return deliveryZones;
  } catch {
    cacheLife(FALLBACK_CACHE_LIFE);
    const stale = await redisGet<ZoneView[]>(REDIS_KEYS.zonesStale);
    if (stale && stale.length > 0) {
      console.warn("[data:zones] Neon unreachable; serving Redis snapshot.");
      return stale;
    }
    console.warn("[data:zones] Neon unreachable; using static fallback zones.");
    return deliveryZones;
  }
}

type CategoryView = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export async function listCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);

  const cached = await redisGet<CategoryView[]>(REDIS_KEYS.categories);
  if (cached && cached.length > 0) {
    cacheLife("hours");
    return cached;
  }

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
    if (rows.length > 0) {
      const mapped = rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
      }));
      await mirrorCatalog(REDIS_KEYS.categories, REDIS_KEYS.categoriesStale, mapped);
      return mapped;
    }
    return categories;
  } catch {
    cacheLife(FALLBACK_CACHE_LIFE);
    const stale = await redisGet<CategoryView[]>(REDIS_KEYS.categoriesStale);
    if (stale && stale.length > 0) {
      console.warn("[data:categories] Neon unreachable; serving Redis snapshot.");
      return stale;
    }
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
