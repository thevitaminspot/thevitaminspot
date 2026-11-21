import { ZonesAdmin } from "@/components/admin/zones-admin";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { syncDeliveryZones } from "@/lib/sync-zones";

export const metadata = { title: "Delivery Zones" };
export const instant = false;

export default async function AdminZonesPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  await syncDeliveryZones();
  const zones = await prisma.deliveryZone.findMany({ orderBy: { name: "asc" } });
  const activeCount = zones.filter((z) => z.isActive).length;

  if (zones.length === 0) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="Shop"
          title="Delivery"
          description="Abuja areas, other Nigerian cities, and international rates."
        />
        <AdminPanel className="p-6">
          <p className="text-sm text-deep/70">No delivery zones configured in Neon yet.</p>
          <div className="mt-4">
            <SeedCatalogueButton label="Load starter delivery zones" />
          </div>
        </AdminPanel>
      </div>
    );
  }

  return <ZonesAdmin zones={zones} activeCount={activeCount} />;
}
