import { InfusionCatalog } from "@/components/admin/infusion-catalog";
import { getAdminUser } from "@/lib/admin";
import { listInfusions } from "@/lib/data";
import { listLibraryImages } from "@/lib/library-images";

export default async function AdminInfusionsPage() {
  const admin = await getAdminUser();
  if (!admin) return <p>Sign in to manage infusions.</p>;
  const [rows, library] = await Promise.all([listInfusions(), listLibraryImages()]);

  return (
    <div>
      <h1 className="font-display text-4xl">Infusions</h1>
      <p className="mt-2 text-sm text-deep/60">Price and deposit are in naira. Duration is in minutes.</p>
      <InfusionCatalog infusions={rows} library={library} />
    </div>
  );
}
