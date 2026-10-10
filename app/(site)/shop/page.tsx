import { ShopCatalog } from "@/components/shop/shop-catalog";
import { pageShell, pageWide } from "@/components/ui/layout-styles";
import { listCategories, listProducts } from "@/lib/data";

export const metadata = {
  title: "Shop vitamin packs in Abuja",
  description:
    "Buy vitamin packs and supplements from The Vitamin Spot in Abuja. Collagen, probiotics, iron, and more. Delivery around Abuja.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);

  return (
    <main className={pageShell}>
      <div className={pageWide}>
        <h1 className="animate-hero-in font-display text-5xl md:text-7xl">Shop</h1>
        <ShopCatalog products={products} categories={categories} />
      </div>
    </main>
  );
}
