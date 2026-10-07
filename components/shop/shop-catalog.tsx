"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { formSearch } from "@/components/ui/form-styles";
import { Reveal } from "@/components/ui/reveal";

export function ShopCatalog({
  products,
  categories,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    return products
      .filter((product) => {
        const matchCategory = category === "all" || product.categorySlug === category;
        const matchQuery = `${product.name} ${product.tagline} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchCategory && matchQuery;
      })
      .sort((left, right) => {
        if (sort === "price-asc") return left.price - right.price;
        if (sort === "price-desc") return right.price - left.price;
        return Number(right.featured) - Number(left.featured);
      });
  }, [products, category, query, sort]);

  return (
    <div className="mt-8">
      {/* Category Pills Bar */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
            category === "all"
              ? "bg-deep text-cream shadow-sm"
              : "border border-deep/15 bg-white/70 text-deep/75 hover:bg-white hover:text-deep"
          }`}
        >
          {`All packs (${products.length})`}
        </button>
        {categories.map((item) => {
          const count = products.filter((p) => p.categorySlug === item.slug).length;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
                category === item.slug
                  ? "bg-deep text-cream shadow-sm"
                  : "border border-deep/15 bg-white/70 text-deep/75 hover:bg-white hover:text-deep"
              }`}
            >
              {`${item.name}${count > 0 ? ` (${count})` : ""}`}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-deep/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vitamins, ingredients, benefits..."
            className={formSearch}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-deep/50 hover:text-deep"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-deep/10 bg-cream/40 px-3 py-1.5">
            <span className="text-[11px] text-deep/60">Sort:</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              suppressHydrationWarning
              className="bg-transparent text-xs font-medium text-deep focus:outline-none"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <span className="hidden text-xs text-deep/50 sm:inline">
            {`${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="my-16 rounded-2xl border border-dashed border-deep/20 bg-white/50 p-12 text-center">
          <p className="font-display text-2xl text-deep">No matching formulas found</p>
          <p className="mt-2 text-xs text-deep/60">
            Try adjusting your search keywords or clear category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-5 rounded-xl bg-deep px-5 py-2.5 text-xs font-medium tracking-wider text-cream uppercase transition hover:bg-deep/90"
          >
            Reset Filters
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
