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

/** Cached checkout zone list — avoids live DB writes/counts on every checkout page load. */
export async function listCheckoutZones(): Promise<CatalogZone[]> {
  "use cache";
  cacheTag(CACHE_TAGS.zones);
  cacheLife("hours");

  const prisma = await tryPrisma();
  if (!prisma) return deliveryZones;

  await syncDeliveryZones();

  const slugs = deliveryZones.map((zone) => zone.slug);
  const rows = await prisma.deliveryZone.findMany({
    where: { isActive: true, slug: { in: slugs } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, fee: true, eta: true },
  });

  return rows.length === 0 ? deliveryZones : rows;
}
