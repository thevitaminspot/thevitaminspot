"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";
import { surface } from "@/components/ui/layout-styles";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const add = useCartStore((state) => state.add);
  const [justAdded, setJustAdded] = useState(false);
  const [loadHover, setLoadHover] = useState(false);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    };
  }, []);

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
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article
      onPointerEnter={(event) => {
        if (hover && event.pointerType === "mouse") setLoadHover(true);
      }}
      className={`group ${surface} flex h-full flex-col overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-deep/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(11,44,33,0.08)]`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-tint/30">
        <Link href={`/shop/${product.slug}`} className="block size-full">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt || product.name}
              width={800}
              height={1000}
              sizes="(min-width: 1280px) 360px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 96vw"
              className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="size-full bg-tint/60" />
          )}

          {hover && loadHover ? (
            <Image
              src={hover.url}
              alt=""
              width={800}
              height={1000}
              sizes="(min-width: 1280px) 360px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 96vw"
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            />
          ) : null}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {isOutOfStock ? (
            <span className="rounded-full bg-deep px-2.5 py-1 text-[10px] font-semibold tracking-wider text-cream uppercase">
              Sold out
            </span>
          ) : isLowStock ? (
            <span className="rounded-full bg-amber-800 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
              {`Only ${product.stock} Left`}
            </span>
          ) : null}

          {hasDiscount && !isOutOfStock ? (
            <span className="rounded-full bg-sage px-2.5 py-1 text-[10px] font-semibold tracking-wider text-deep uppercase">
              Special Offer
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0 flex-1">
          <Link
            href={`/shop/${product.slug}`}
            className="font-display block text-xl leading-snug text-deep transition hover:text-deep-hover md:text-2xl"
          >
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-deep/70">
            {product.tagline}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-deep/8 pt-4">
          <div className="flex items-baseline gap-2">
            <p className="font-display text-lg text-deep md:text-xl">{formatNaira(product.price)}</p>
            {hasDiscount ? (
              <p className="text-xs text-deep/60 line-through">
                {formatNaira(product.compareAtPrice!)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-medium tracking-wider uppercase transition duration-200 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep ${
              isOutOfStock
                ? "cursor-not-allowed bg-deep/5 text-deep/45"
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
