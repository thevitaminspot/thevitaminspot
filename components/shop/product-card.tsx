"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";

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
    <article className="group panel flex h-full flex-col overflow-hidden rounded-2xl border border-deep/10 bg-white transition-all duration-300 hover:border-deep/20 hover:shadow-lg">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-tint/30">
        <Link href={`/shop/${product.slug}`} className="block size-full">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt || product.name}
              width={800}
              height={1000}
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
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-deep/60">
            {product.tagline}
          </p>
        </div>

        <div className="mt-5 border-t border-deep/5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-lg text-deep md:text-xl">
                  {formatNaira(product.price)}
                </p>
                {hasDiscount ? (
                  <p className="text-xs text-deep/40 line-through">
                    {formatNaira(product.compareAtPrice!)}
                  </p>
                ) : null}
              </div>
              <p className="text-[10px] text-deep/50">30-day sachet box</p>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-medium tracking-wider uppercase transition ${
                isOutOfStock
                  ? "cursor-not-allowed bg-deep/5 text-deep/30"
                  : justAdded
                    ? "bg-sage text-deep shadow-sm"
                    : "border border-deep/20 bg-cream/50 text-deep hover:bg-deep hover:text-cream hover:shadow-md"
              }`}
            >
              {justAdded ? <span>Added</span> : isOutOfStock ? <span>Sold out</span> : <span>Add</span>}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
