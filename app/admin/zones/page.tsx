import { ZonesAdmin } from "@/components/admin/zones-admin";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { listCheckoutZones } from "@/lib/sync-zones";

export const metadata = { title: "Delivery Zones" };
export const instant = false;

export default async function AdminZonesPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  await listCheckoutZones();
  const zones = await prisma.deliveryZone.findMany({ orderBy: { name: "asc" } });
  const activeCount = zones.filter((z) => z.isActive).length;

  if (zones.length === 0) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="Shop"
          title="Delivery"
          description="Abuja courier rates and delivery timelines."
        />
        <AdminPanel className="p-6">
          <p className="text-sm text-deep/70">No delivery zones configured in Neon yet.</p>
          <div className="mt-4">
            <SeedCatalogueButton label="Load Abuja Starter Zones" />
          </div>
        </AdminPanel>
      </div>
    );
  }

  return <ZonesAdmin zones={zones} activeCount={activeCount} />;
}
