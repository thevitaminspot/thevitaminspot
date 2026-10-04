import { ProductCatalog } from "@/components/admin/product-catalog";
import { getAdminUser } from "@/lib/admin";
import { listProducts } from "@/lib/data";
import { listLibraryImages } from "@/lib/library-images";

export default async function AdminProductsPage() {
  const admin = await getAdminUser();
  if (!admin) return <p>Sign in to manage products.</p>;
  const [rows, library] = await Promise.all([listProducts(), listLibraryImages()]);

  return (
    <div>
      <h1 className="font-display text-4xl">Products</h1>
      <p className="mt-2 text-sm text-deep/60">Prices are in naira. Saving updates the shop.</p>
      <ProductCatalog products={rows} library={library} />
    </div>
  );
}
