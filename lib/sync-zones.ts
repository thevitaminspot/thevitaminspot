import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { deliveryZones, type CatalogZone } from "@/lib/catalog";
import { tryPrisma } from "@/lib/db";

const retiredZoneSlugs = ["abuja-central", "abuja-extended", "nationwide"];

/** Create any missing Abuja / remote zones and retire the old three-zone list. */
export async function syncDeliveryZones() {
  const prisma = await tryPrisma();
  if (!prisma) return;

  const slugs = deliveryZones.map((zone) => zone.slug);
  const [existingCount, retiredCount] = await Promise.all([
    prisma.deliveryZone.count({ where: { slug: { in: slugs } } }),
    prisma.deliveryZone.count({ where: { isActive: true, slug: { in: retiredZoneSlugs } } }),
  ]);

  if (existingCount < deliveryZones.length) {
    await prisma.deliveryZone.createMany({
      data: deliveryZones.map((zone) => ({
        name: zone.name,
        slug: zone.slug,
        fee: zone.fee,
        eta: zone.eta,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  if (retiredCount > 0) {
    await prisma.deliveryZone.updateMany({
      where: { slug: { in: retiredZoneSlugs } },
      data: { isActive: false },
    });
  }
}

const FALLBACK_CACHE_LIFE = { stale: 300, revalidate: 15, expire: 300 } as const;

/** Cached checkout zone list — avoids live DB writes/counts on every checkout page load. */
export async function listCheckoutZones(): Promise<CatalogZone[]> {
  "use cache";
  cacheTag(CACHE_TAGS.zones);

  const prisma = await tryPrisma();
  if (!prisma) {
    cacheLife("hours");
    return deliveryZones;
  }

  try {
    await syncDeliveryZones();

    const slugs = deliveryZones.map((zone) => zone.slug);
    const rows = await prisma.deliveryZone.findMany({
      where: { isActive: true, slug: { in: slugs } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, fee: true, eta: true },
    });

    cacheLife("hours");
    return rows.length === 0 ? deliveryZones : rows;
  } catch {
    cacheLife(FALLBACK_CACHE_LIFE);
    console.warn("[zones:checkout] Neon unreachable; using static fallback zones.");
    return deliveryZones;
  }
}
