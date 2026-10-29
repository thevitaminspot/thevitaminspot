import { ShopCatalog } from "@/components/shop/shop-catalog";
import { pageShell, pageWide } from "@/components/ui/layout-styles";
import { listProducts } from "@/lib/data";

export const metadata = {
  title: "Shop vitamin packs in Abuja",
  description:
    "Buy vitamin packs and supplements from The Vitamin Spot in Abuja. Collagen, probiotics, iron, and more. Delivery around Abuja.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await listProducts();

  return (
    <main className={pageShell}>
      <div className={pageWide}>
        <h1 className="animate-hero-in font-display text-5xl md:text-7xl">Shop</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-deep/60">
          Take-home packs from the lounge. Open a pack for what’s inside and how to take it.
        </p>
        <ShopCatalog products={products} />
      </div>
    </main>
  );
}
