import { ProductCatalog } from "@/components/admin/product-catalog";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
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
      <h1 className="font-display text-4xl">Products</h1>
      <p className="mt-2 text-sm text-deep/60">
        Prices are in naira. Saving updates the shop. New pictures upload to Cloudinary.
      </p>
      <SeedCatalogueButton label="Add any missing starter products" />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">Nothing is in the catalogue yet.</p>
      ) : null}
      <ProductCatalog products={rows} library={library} />
    </div>
  );
}
