"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { CatalogProduct } from "@/lib/catalog";
import { interactiveControl } from "@/components/ui/form-styles";

const sorts = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
] as const;

export function ShopCatalog({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("featured");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((product) => {
        if (!needle) return true;
        return `${product.name} ${product.tagline} ${product.description} ${product.ingredients.join(" ")} ${product.benefits.join(" ")}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => {
        if (sort === "price-asc") return left.price - right.price;
        if (sort === "price-desc") return right.price - left.price;
        return (
          Number(right.featured) - Number(left.featured) ||
          left.name.localeCompare(right.name)
        );
      });
  }, [products, query, sort]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-6 border-b border-deep/10 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <label className="block min-w-0 flex-1">
          <span className="text-[11px] tracking-[0.16em] text-deep/45 uppercase">Search</span>
          <div className="relative mt-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, ingredient, or benefit"
              autoComplete="off"
              className="w-full border-0 border-b border-deep/20 bg-transparent py-2.5 pr-9 text-sm text-deep placeholder:text-deep/35 transition focus:border-deep/50 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className={`absolute top-1/2 right-0 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-lg leading-none text-deep/40 transition hover:text-deep ${interactiveControl}`}
              >
                ×
              </button>
            ) : null}
          </div>
        </label>

        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[11px] tracking-[0.16em] text-deep/45 uppercase">Sort</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {sorts.map((option) => {
              const active = sort === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSort(option.id)}
                  className={`text-sm transition ${interactiveControl} ${
                    active ? "text-deep" : "text-deep/40 hover:text-deep/70"
                  }`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-deep/45">
        {filtered.length === products.length
          ? `${products.length} ${products.length === 1 ? "pack" : "packs"}`
          : `${filtered.length} of ${products.length} packs`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-14 max-w-sm">
          <p className="font-display text-3xl text-deep">Nothing matched.</p>
          <p className="mt-3 text-sm leading-relaxed text-deep/60">
            Try another word, or clear search to see every pack.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`mt-6 cursor-pointer text-[11px] font-medium tracking-[0.16em] text-deep uppercase underline decoration-deep/25 underline-offset-4 ${interactiveControl}`}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {filtered.map((product, index) => (
            <Reveal key={product.id} delay={(index % 6) * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
