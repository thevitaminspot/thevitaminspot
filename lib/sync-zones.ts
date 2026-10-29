import { deliveryZones, type CatalogZone } from "@/lib/catalog";
import { tryPrisma } from "@/lib/db";

const retiredZoneSlugs = ["abuja-central", "abuja-extended", "nationwide"];

/** Create any missing Abuja areas and retire the old three-zone list. */
export async function listCheckoutZones(): Promise<CatalogZone[]> {
  const prisma = await tryPrisma();
  if (!prisma) return deliveryZones;

  const slugs = deliveryZones.map((zone) => zone.slug);
  const [activeCount, retiredCount] = await Promise.all([
    prisma.deliveryZone.count({ where: { isActive: true, slug: { in: slugs } } }),
    prisma.deliveryZone.count({ where: { isActive: true, slug: { in: retiredZoneSlugs } } }),
  ]);

  if (activeCount < deliveryZones.length || retiredCount > 0) {
    for (const zone of deliveryZones) {
      await prisma.deliveryZone.upsert({
        where: { slug: zone.slug },
        create: {
          name: zone.name,
          slug: zone.slug,
          fee: zone.fee,
          eta: zone.eta,
          isActive: true,
        },
        update: { name: zone.name },
      });
    }

    await prisma.deliveryZone.updateMany({
      where: { slug: { in: retiredZoneSlugs } },
      data: { isActive: false },
    });
  }

  const rows = await prisma.deliveryZone.findMany({
    where: { isActive: true, slug: { in: slugs } },
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) return deliveryZones;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    fee: row.fee,
    eta: row.eta,
  }));
}
