"use client";

import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const add = useCartStore((state) => state.add);
  const photo = product.images[0];
  const hover = product.images[1];

  return (
    <article className="panel flex h-full flex-col overflow-hidden bg-white">
      <Link href={`/shop/${product.slug}`} className="relative block">
        <Image
          src={photo.url}
          alt={photo.alt}
          width={800}
          height={1000}
          className="aspect-[4/5] w-full object-cover"
        />
        {hover ? (
          <Image
            src={hover.url}
            alt=""
            width={800}
            height={1000}
            className="absolute inset-0 aspect-[4/5] w-full object-cover opacity-0 transition duration-500 hover:opacity-100"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/shop/${product.slug}`} className="font-display text-2xl leading-none text-deep">
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-deep/60">{product.tagline}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-deep">{formatNaira(product.price)}</p>
          <button
            type="button"
            onClick={() =>
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: photo.url,
              })
            }
            className="rounded-lg border border-deep/15 px-3 py-2 text-[11px] tracking-[0.1em] uppercase hover:bg-tint"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
