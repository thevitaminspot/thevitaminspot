"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";

export function AddToBag({ product }: { product: CatalogProduct }) {
  const add = useCartStore((state) => state.add);

  return (
    <button
      type="button"
      disabled={product.stock < 1}
      onClick={() =>
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0].url,
        })
      }
      className="mt-8 rounded-lg bg-deep px-8 py-4 text-[11px] tracking-[0.22em] text-cream uppercase disabled:opacity-40"
    >
      {product.stock < 1 ? "Sold through" : "Add to bag"}
    </button>
  );
}
