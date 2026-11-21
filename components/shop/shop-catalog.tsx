"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#shop-search") return;
    const input = document.getElementById("shop-search");
    if (input instanceof HTMLInputElement) {
      window.requestAnimationFrame(() => input.focus());
    }
  }, []);

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
    <div className="mt-12">
      <div className="border-y border-deep/10 py-6 md:py-7">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0 flex-1 lg:max-w-lg">
            <label
              htmlFor="shop-search"
              className="block text-[11px] tracking-[0.22em] text-deep/65 uppercase"
            >
              Find a pack
            </label>
            <div className="group mt-3 flex items-center gap-3 border-b border-deep/20 transition focus-within:border-deep">
              <Search
                className="size-4 shrink-0 text-deep/55 transition group-focus-within:text-deep"
                strokeWidth={1.35}
                aria-hidden
              />
              <input
                id="shop-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, ingredient, or benefit"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full appearance-none bg-transparent py-3 text-base text-deep placeholder:text-deep/55 outline-none scroll-mt-28 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className={`shrink-0 text-[11px] font-medium tracking-[0.14em] text-deep/65 uppercase transition hover:text-deep ${interactiveControl}`}
                >
                  <span className="inline-flex items-center gap-1">
                    <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Clear
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-[11px] tracking-[0.22em] text-deep/65 uppercase">Sort</p>
            <div
              className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2"
              role="group"
              aria-label="Sort packs"
            >
              {sorts.map((option) => {
                const active = sort === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSort(option.id)}
                    aria-pressed={active}
                    className={`relative pb-1 text-sm transition ${interactiveControl} ${
                      active ? "font-medium text-deep" : "text-deep/65 hover:text-deep"
                    }`}
                  >
                    {option.label}
                    {active ? (
                      <span
                        className="absolute inset-x-0 -bottom-px h-px bg-deep/70"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs tracking-wide text-deep/65">
          {filtered.length === products.length
            ? `${products.length} ${products.length === 1 ? "pack" : "packs"}`
            : `${filtered.length} of ${products.length} packs`}
        </p>
      </div>

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
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
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
