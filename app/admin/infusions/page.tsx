import { InfusionCatalog } from "@/components/admin/infusion-catalog";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { listManagedInfusions } from "@/lib/data";
import { listLibraryImages } from "@/lib/library-images";

export const metadata = { title: "Infusions" };

export default async function AdminInfusionsPage() {
  await requireAdmin();
  const [rows, library] = await Promise.all([listManagedInfusions(), listLibraryImages()]);
  if (!rows) return <DatabaseSetup />;

  return (
    <div>
      <h1 className="font-display text-4xl">Infusions</h1>
      <p className="mt-2 text-sm text-deep/60">Price and deposit are in naira. Duration is in minutes.</p>
      {rows.length === 0 ? <SeedCatalogueButton label="Load starter sessions" /> : null}
      <InfusionCatalog infusions={rows} library={library} />
    </div>
  );
}
