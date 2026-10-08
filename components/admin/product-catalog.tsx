"use client";

import Image from "next/image";
import { AlertTriangle, Eye, EyeOff, Minus, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, toggleProductActive, updateProductStock } from "@/actions/admin";
import { AdminActionMenu } from "@/components/admin/action-menu";
import { AddProductForm, ProductEditor } from "@/components/admin/editors";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { AdminEmptyState, AdminFeedback, AdminFormPanel, AdminPageHeader } from "@/components/admin/ui";
import { useScrollIntoView } from "@/components/admin/use-scroll-into-view";
import { adminButtonPrimary, adminButtonTab, adminFormSearch } from "@/components/ui/form-styles";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "hidden" | "low_stock">("all");
  const [pending, start] = useTransition();

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

  const pagination = usePaginatedList(filtered, `${tab}:${query}`);

  const editing = products.find((product) => product.id === editingId);
  const addFormRef = useScrollIntoView<HTMLDivElement>(adding ? "add" : null);
  const editFormRef = useScrollIntoView<HTMLDivElement>(editingId);

  function openEdit(productId: string) {
    setEditingId(productId);
    setAdding(false);
  }

  function remove(product: CatalogProduct) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    start(async () => {
      const result = await deleteProduct(product.id);
      if ("ok" in result) {
        if (editingId === product.id) setEditingId(null);
        setMessage(`${product.name} deleted.`);
        router.refresh();
      } else {
        setMessage(result.error || "Could not delete.");
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

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Products"
        description="Manage formulations, pricing, and live inventory. Prices are in naira."
        action={
          <button
            type="button"
            onClick={() => {
              setAdding((value) => !value);
              if (!adding) setEditingId(null);
            }}
            className={adminButtonPrimary}
          >
            {adding ? "Close form" : "+ New product"}
          </button>
        }
      />

      {products.length === 0 && !adding ? (
        <AdminEmptyState>Nothing is in the catalogue yet.</AdminEmptyState>
      ) : null}

      {adding ? (
        <div ref={addFormRef} className="mt-6">
          <AdminFormPanel
            title="Add new product"
            description="Upload pictures and set how many you have in stock."
            onCancel={() => setAdding(false)}
          >
            <AddProductForm
              library={library}
              onSuccess={() => {
                setAdding(false);
                setMessage("Product added.");
              }}
              onError={setMessage}
            />
          </AdminFormPanel>
        </div>
      ) : null}

      {editing ? (
        <div ref={editFormRef} className="mt-6">
          <AdminFormPanel
            title={`Editing ${editing.name}`}
            description="Update prices, ingredients, benefits, compare-at pricing, and pictures."
            onCancel={() => setEditingId(null)}
          >
            <ProductEditor
              key={editing.id}
              product={editing}
              library={library}
              onSuccess={() => {
                setEditingId(null);
                setMessage(`${editing.name} saved.`);
              }}
              onError={setMessage}
              onDelete={() => remove(editing)}
            />
          </AdminFormPanel>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4">
          <AdminFeedback message={message} onDismiss={() => setMessage("")} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl border border-deep/10 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`${adminButtonTab} ${
              tab === "all" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`${adminButtonTab} ${
              tab === "active" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setTab("hidden")}
            className={`${adminButtonTab} ${
              tab === "hidden" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
            }`}
          >
            Hidden ({counts.hidden})
          </button>
          <button
            type="button"
            onClick={() => setTab("low_stock")}
            className={`${adminButtonTab} flex items-center gap-1 ${
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

      <div className="mt-4 rounded-2xl border border-deep/10 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-deep/60">
            No products match the selected criteria.
          </div>
        ) : (
          <>
            <TablePagination {...pagination.tablePaginationProps("products")} edge="top" />
            <ul className="divide-y divide-deep/10">
            {pagination.visible.map((product) => {
              const photo = product.images[0];
              const isHidden = product.isActive === false;
              const isLowStock = product.stock <= 5;
              const hasDiscount =
                product.compareAtPrice && product.compareAtPrice > product.price;
              const isEditing = editingId === product.id;

              return (
                <li
                  key={product.id}
                  className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                    isHidden ? "bg-tint/20 opacity-80" : "hover:bg-cream/20"
                  } ${isEditing ? "bg-sage/10 ring-1 ring-inset ring-sage/30" : ""}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-deep/10 bg-tint/40">
                      {photo ? (
                        <Image src={photo.url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="size-full bg-tint" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-deep">{product.name}</p>
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
                        {isEditing ? (
                          <span className="rounded-full bg-deep px-2 py-0.5 text-[10px] font-medium text-cream uppercase">
                            Editing
                          </span>
                        ) : null}
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

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-deep/15 bg-white p-0.5">
                        <button
                          type="button"
                          disabled={pending || product.stock <= 0}
                          onClick={() => handleAdjustStock(product, product.stock - 1)}
                          className="flex size-6 cursor-pointer items-center justify-center rounded-md text-deep/70 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-30"
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
                          className="flex size-6 cursor-pointer items-center justify-center rounded-md text-deep/70 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-30"
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
                        className={`cursor-pointer rounded-lg p-2 transition disabled:cursor-not-allowed ${
                          isHidden
                            ? "bg-deep/10 text-deep/60 hover:bg-deep/20"
                            : "bg-sage/20 text-deep hover:bg-sage/30"
                        }`}
                      >
                        {isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    <AdminActionMenu
                      label={`Actions for ${product.name}`}
                      disabled={pending}
                      items={[
                        {
                          label: "Edit formulation",
                          onClick: () => openEdit(product.id),
                        },
                        {
                          type: "link",
                          label: "View on store ↗",
                          href: `/shop/${product.slug}`,
                          external: true,
                        },
                        {
                          label: "Delete product",
                          tone: "danger",
                          disabled: pending,
                          onClick: () => remove(product),
                        },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
            </ul>
            <TablePagination {...pagination.tablePaginationProps("products")} edge="bottom" />
          </>
        )}
      </div>
    </div>
  );
}
