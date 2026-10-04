import { ShopCatalog } from "@/components/shop/shop-catalog";
import { listCategories, listProducts } from "@/lib/data";

export const metadata = {
  title: "Shop",
  description: "Supplements and vitamins from The Vitamin Spot in Abuja.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);

  return (
    <main className="px-5 py-16 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-5xl md:text-7xl">Shop</h1>
        <ShopCatalog products={products} categories={categories} />
      </div>
    </main>
  );
}
