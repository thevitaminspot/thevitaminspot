import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AddZoneForm, ZoneForm } from "@/components/admin/zone-form";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Delivery Zones" };

export default async function AdminZonesPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const zones = await prisma.deliveryZone.findMany({ orderBy: { fee: "asc" } });
  const activeCount = zones.filter((z) => z.isActive).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Delivery"
        description={`${activeCount} active of ${zones.length} zones. Abuja courier rates and delivery timelines.`}
        action={<AddZoneForm />}
      />

      {zones.length === 0 ? (
        <AdminPanel className="p-6">
          <p className="text-sm text-deep/70">No delivery zones configured in Neon yet.</p>
          <div className="mt-4">
            <SeedCatalogueButton label="Load Abuja Starter Zones" />
          </div>
        </AdminPanel>
      ) : (
        <AdminPanel>
          <div className="border-b border-deep/8 bg-cream/20 px-5 py-3 text-[11px] tracking-[0.14em] text-deep/45 uppercase">
            Current rates
          </div>
          <ul className="divide-y divide-deep/6">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-cream/20 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-deep">{zone.name}</span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase ring-1 ring-inset ${
                        zone.isActive
                          ? "bg-sage/15 text-deep ring-sage/30"
                          : "bg-deep/[0.04] text-deep/50 ring-deep/10"
                      }`}
                    >
                      {zone.isActive ? "Live" : "Off"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-deep/50">
                    Slug: <code className="text-sage">{zone.slug}</code> · Base: {formatNaira(zone.fee)}
                  </p>
                </div>
                <ZoneForm
                  id={zone.id}
                  feeNaira={Math.round(zone.fee / 100)}
                  eta={zone.eta}
                  isActive={zone.isActive}
                />
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </div>
  );
}
