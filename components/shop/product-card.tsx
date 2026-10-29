"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";
import { surface } from "@/components/ui/layout-styles";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const add = useCartStore((state) => state.add);
  const [justAdded, setJustAdded] = useState(false);

  const photo = product.images[0];
  const hover = product.images[1];
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  function handleAdd() {
    if (isOutOfStock) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: photo?.url || "",
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className={`group ${surface} flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-deep/20`}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-tint/30">
        <Link href={`/shop/${product.slug}`} className="block size-full">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt || product.name}
              width={800}
              height={1000}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="size-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-tint/60" />
          )}

          {hover ? (
            <Image
              src={hover.url}
              alt=""
              width={800}
              height={1000}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            />
          ) : null}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {isOutOfStock ? (
            <span className="bg-deep px-2.5 py-1 text-[10px] font-semibold tracking-wider text-cream uppercase">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-800 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
              {`Only ${product.stock} Left`}
            </span>
          ) : null}

          {hasDiscount && !isOutOfStock ? (
            <span className="bg-sage px-2.5 py-1 text-[10px] font-semibold tracking-wider text-deep uppercase">
              Special Offer
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0 flex-1">
          <Link
            href={`/shop/${product.slug}`}
            className="font-display block text-xl leading-snug text-deep transition hover:text-sage md:text-2xl"
          >
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-deep/55">
            {product.tagline}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-deep/8 pt-4">
          <div className="flex items-baseline gap-2">
            <p className="font-display text-lg text-deep md:text-xl">{formatNaira(product.price)}</p>
            {hasDiscount ? (
              <p className="text-xs text-deep/35 line-through">
                {formatNaira(product.compareAtPrice!)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-medium tracking-wider uppercase transition ${
              isOutOfStock
                ? "cursor-not-allowed bg-deep/5 text-deep/30"
                : justAdded
                  ? "bg-sage text-deep"
                  : "border border-deep/20 bg-cream/50 text-deep hover:bg-deep hover:text-cream"
            }`}
          >
            {justAdded ? <span>Added</span> : isOutOfStock ? <span>Sold out</span> : <span>Add</span>}
          </button>
        </div>
      </div>
    </article>
  );
}
