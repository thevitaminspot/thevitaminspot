import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AddZoneForm, ZoneForm } from "@/components/admin/zone-form";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-deep">Delivery Zones</h1>
          <p className="mt-1 text-sm text-deep/60">
            {activeCount} active of {zones.length} zones. Direct Abuja courier rates and delivery timelines.
          </p>
        </div>
        <AddZoneForm />
      </div>

      {zones.length === 0 ? (
        <div className="mt-6 rounded-xl border border-deep/10 bg-white p-6">
          <p className="text-sm text-deep/70">No delivery zones configured in Neon yet.</p>
          <SeedCatalogueButton label="Load Abuja Starter Zones" />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-deep/10 bg-white shadow-sm">
          <div className="border-b border-deep/10 bg-cream/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-deep/60">
            Current Fulfillment Rates
          </div>
          <ul className="divide-y divide-deep/10">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-col gap-4 p-4 hover:bg-cream/20 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-deep">{zone.name}</span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        zone.isActive ? "bg-tint/70 text-deep" : "bg-deep/10 text-deep/50"
                      }`}
                    >
                      {zone.isActive ? "Live in checkout" : "Disabled"}
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
        </div>
      )}
    </div>
  );
}
