import { ProductCatalog } from "@/components/admin/product-catalog";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { listManagedProducts } from "@/lib/data";
import { listLibraryImages } from "@/lib/library-images";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const [rows, library] = await Promise.all([listManagedProducts(), listLibraryImages()]);
  if (!rows) return <DatabaseSetup />;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Products"
        description="Prices are in naira. Saving updates the shop. New pictures upload to Cloudinary."
        action={<SeedCatalogueButton label="Add missing starters" />}
      />
      {rows.length === 0 ? (
        <AdminEmptyState>Nothing is in the catalogue yet.</AdminEmptyState>
      ) : null}
      <ProductCatalog products={rows} library={library} />
    </div>
  );
}
