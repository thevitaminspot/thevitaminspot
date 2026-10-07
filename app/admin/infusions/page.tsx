import { InfusionCatalog } from "@/components/admin/infusion-catalog";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { listManagedInfusions } from "@/lib/data";
import { listLibraryImages } from "@/lib/library-images";

export const metadata = { title: "Infusions" };
export const instant = false;

export default async function AdminInfusionsPage() {
  await requireAdmin();
  const [rows, library] = await Promise.all([listManagedInfusions(), listLibraryImages()]);
  if (!rows) return <DatabaseSetup />;

  return <InfusionCatalog infusions={rows} library={library} />;
}
