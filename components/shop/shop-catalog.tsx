"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/ui/reveal";
import { SearchField } from "@/components/ui/search-field";
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
      <div className="relative overflow-hidden rounded-[1.75rem] border border-deep/10 bg-gradient-to-br from-white via-cream/50 to-tint/40 p-4 sm:p-5">
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-sage/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-8 size-44 rounded-full bg-deep/[0.04] blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Name, ingredient, or benefit"
            label="Find a pack"
            variant="storefront"
            className="min-w-0 flex-1"
          />

          <div className="flex shrink-0 flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] text-deep/45 uppercase">Sort</span>
            <div className="flex flex-wrap gap-1.5">
              {sorts.map((option) => {
                const active = sort === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSort(option.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition ${interactiveControl} ${
                      active
                        ? "bg-deep text-cream shadow-sm shadow-deep/15"
                        : "bg-white/75 text-deep/55 ring-1 ring-deep/10 hover:text-deep"
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

        <p className="relative mt-4 text-xs text-deep/45">
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
