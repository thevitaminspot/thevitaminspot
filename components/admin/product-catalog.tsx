"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, toggleProductActive, updateProductStock } from "@/actions/admin";
import { AddProductForm, ProductEditor } from "@/components/admin/editors";
import { adminFormSearch } from "@/components/ui/form-styles";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductCatalog({
  products,
  library,
}: {
  products: CatalogProduct[];
  library: string[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "hidden" | "low_stock">("all");
  const [pending, start] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenId(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const counts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.isActive !== false).length,
      hidden: products.filter((p) => p.isActive === false).length,
      lowStock: products.filter((p) => p.stock <= 5).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.tagline.toLowerCase().includes(query.toLowerCase()) ||
        p.slug.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) return false;

      if (tab === "active") return p.isActive !== false;
      if (tab === "hidden") return p.isActive === false;
      if (tab === "low_stock") return p.stock <= 5;
      return true;
    });
  }, [products, query, tab]);

  function remove(product: CatalogProduct) {
    setOpenId(null);
    if (!window.confirm(`Delete ${product.name}?`)) return;
    start(async () => {
      const result = await deleteProduct(product.id);
      setMessage("error" in result && result.error ? result.error : `${product.name} deleted.`);
      if ("ok" in result) {
        if (editingId === product.id) setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleToggleActive(product: CatalogProduct) {
    start(async () => {
      const result = await toggleProductActive(product.id);
      if ("error" in result && result.error) {
        setMessage(result.error);
      } else {
        setMessage(
          `${product.name} is now ${result.isActive ? "visible in the store" : "hidden"}.`,
        );
        router.refresh();
      }
    });
  }

  function handleAdjustStock(product: CatalogProduct, newStock: number) {
    if (newStock < 0) return;
    start(async () => {
      const result = await updateProductStock(product.id, newStock);
      if ("error" in result && result.error) {
        setMessage(result.error);
      } else {
        setMessage(`Stock updated for ${product.name} (${newStock} units).`);
        router.refresh();
      }
    });
  }

  const editing = products.find((product) => product.id === editingId);

  return (
    <div className="mt-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-deep">Product Catalogue</h2>
          <p className="mt-0.5 text-xs text-deep/60">
            Manage your daily vitamin packs, formulations, pricing, and live inventory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((value) => !value);
            if (editingId) setEditingId(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-deep px-5 py-2.5 text-xs font-medium tracking-wider text-cream uppercase transition hover:bg-deep/90 shadow-sm"
        >
          {adding ? "Close Form" : "+ New Product"}
        </button>
      </div>

      {adding ? (
        <div className="mt-6 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg text-deep">Add New Product Formulation</h3>
          <p className="mt-1 text-xs text-deep/60">
            Upload pictures and set how many you have.
          </p>
          <div className="mt-5">
            <AddProductForm library={library} />
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-tint/60 px-4 py-2.5 text-xs text-deep">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="text-deep/50 hover:text-deep"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Filter Tabs and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl border border-deep/10 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "all" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "active" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setTab("hidden")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "hidden" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            Hidden ({counts.hidden})
          </button>
          <button
            type="button"
            onClick={() => setTab("low_stock")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === "low_stock" ? "bg-amber-600 text-white" : "text-deep/70 hover:bg-tint"
            }`}
          >
            {counts.lowStock > 0 ? <AlertTriangle className="size-3 text-amber-500" /> : null}
            <span>Low Stock ({counts.lowStock})</span>
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-deep/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalogue..."
            className={adminFormSearch}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-deep/10 bg-white shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-deep/60">
            No products match the selected criteria.
          </div>
        ) : (
          <ul className="divide-y divide-deep/10">
            {filtered.map((product) => {
              const photo = product.images[0];
              const open = openId === product.id;
              const isHidden = product.isActive === false;
              const isLowStock = product.stock <= 5;
              const hasDiscount =
                product.compareAtPrice && product.compareAtPrice > product.price;

              return (
                <li
                  key={product.id}
                  className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                    isHidden ? "bg-tint/20 opacity-80" : "hover:bg-cream/20"
                  } ${open ? "relative z-20" : ""}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-deep/10 bg-tint/40">
                      {photo ? (
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="size-full bg-tint" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-sm text-deep">{product.name}</p>
                        {product.featured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-semibold text-deep uppercase">
                            <Sparkles className="size-2.5 text-sage" />
                            Featured
                          </span>
                        ) : null}
                        {isHidden ? (
                          <span className="rounded-full bg-deep/10 px-2 py-0.5 text-[10px] font-medium text-deep/70 uppercase">
                            Hidden
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 uppercase">
                            Live
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-deep/60">
                        <span className="font-semibold text-deep">
                          {formatNaira(product.price)}
                        </span>
                        {hasDiscount ? (
                          <span className="text-deep/40 line-through">
                            {formatNaira(product.compareAtPrice!)}
                          </span>
                        ) : null}
                        <span>·</span>
                        <span>{product.categorySlug}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Quick Stepper & Visibility Switch */}
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-deep/15 bg-white p-0.5">
                        <button
                          type="button"
                          disabled={pending || product.stock <= 0}
                          onClick={() => handleAdjustStock(product, product.stock - 1)}
                          className="flex size-6 items-center justify-center rounded-md text-deep/70 hover:bg-tint disabled:opacity-30"
                          title="Reduce stock"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span
                          className={`w-10 text-center text-xs font-semibold ${
                            product.stock === 0
                              ? "text-red-600"
                              : isLowStock
                                ? "text-amber-600"
                                : "text-deep"
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleAdjustStock(product, product.stock + 1)}
                          className="flex size-6 items-center justify-center rounded-md text-deep/70 hover:bg-tint disabled:opacity-30"
                          title="Add stock"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggleActive(product)}
                        title={isHidden ? "Make visible in store" : "Hide from store"}
                        className={`rounded-lg p-2 transition ${
                          isHidden
                            ? "bg-deep/10 text-deep/60 hover:bg-deep/20"
                            : "bg-sage/20 text-deep hover:bg-sage/30"
                        }`}
                      >
                        {isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative" ref={open ? menuRef : undefined}>
                      <button
                        type="button"
                        aria-label={`Actions for ${product.name}`}
                        aria-expanded={open}
                        className="rounded-lg p-2 text-deep/70 hover:bg-tint"
                        onClick={() => setOpenId(open ? null : product.id)}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>

                      {open ? (
                        <div
                          role="menu"
                          className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-deep/10 bg-white py-1.5 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="block w-full px-4 py-2 text-left text-xs text-deep hover:bg-tint"
                            onClick={() => {
                              setEditingId(product.id);
                              setOpenId(null);
                              setAdding(false);
                            }}
                          >
                            Edit Formulation
                          </button>
                          <Link
                            role="menuitem"
                            href={`/shop/${product.slug}`}
                            target="_blank"
                            className="block px-4 py-2 text-xs text-deep hover:bg-tint"
                            onClick={() => setOpenId(null)}
                          >
                            View on Store ↗
                          </Link>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={pending}
                            className="block w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                            onClick={() => remove(product)}
                          >
                            Delete Product
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Edit Drawer / Form */}
      {editing ? (
        <div className="mt-8 rounded-2xl border border-deep/15 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-deep/10 pb-3">
            <div>
              <p className="font-display text-xl text-deep">Editing {editing.name}</p>
              <p className="text-xs text-deep/60">
                Update prices, ingredients, benefits, compare-at pricing, and pictures.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-deep/15 px-3 py-1.5 text-xs font-medium text-deep uppercase hover:bg-tint"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
          <ProductEditor key={editing.id} product={editing} library={library} />
        </div>
      ) : null}
    </div>
  );
}
