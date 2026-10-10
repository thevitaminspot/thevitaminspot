"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";
import { formSubmitInline } from "@/components/ui/form-styles";

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
      className={`mt-8 ${formSubmitInline}`}
    >
      {product.stock < 1 ? "Sold through" : "Add to bag"}
    </button>
  );
}
