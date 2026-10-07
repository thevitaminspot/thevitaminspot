import { InfusionCatalog } from "@/components/admin/infusion-catalog";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AdminPageHeader } from "@/components/admin/ui";
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
      <AdminPageHeader
        eyebrow="Clinic"
        title="Infusions"
        description="Price and deposit are in naira. Duration is in minutes."
        action={
          rows.length === 0 ? <SeedCatalogueButton label="Load starter sessions" /> : undefined
        }
      />
      <InfusionCatalog infusions={rows} library={library} />
    </div>
  );
}
