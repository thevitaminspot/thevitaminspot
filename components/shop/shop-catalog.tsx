"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";

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
        const matchQuery = `${product.name} ${product.tagline}`
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
    <div className="mt-10">
      <div className="flex flex-col gap-4 border-b border-deep/10 pb-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-deep/60">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="w-full rounded-lg border border-deep/15 bg-transparent px-4 py-3 md:max-w-sm"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="field-sizing-content w-fit self-start rounded-lg border border-deep/15 bg-white py-3 pl-4 pr-0"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="field-sizing-content w-fit self-start rounded-lg border border-deep/15 bg-white py-3 pl-4 pr-0"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
        </select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="mt-12 text-sm text-deep/60">Nothing matches that search.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
