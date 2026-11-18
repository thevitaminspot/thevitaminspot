"use client";

import Image from "next/image";
import { Eye, EyeOff, Minus, Plus, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, toggleProductActive, updateProductStock } from "@/actions/admin";
import { AdminActionMenu } from "@/components/admin/action-menu";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { AddProductForm, ProductEditor } from "@/components/admin/editors";
import { AdminListSearch } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { AdminEmptyState, AdminFilterTabs, AdminPageHeader } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { adminButtonPrimary } from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { formatNaira } from "@/lib/money";
import type { CatalogProduct } from "@/lib/catalog";
import { withActionError } from "@/lib/server-action-error";

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
  const [deleting, setDeleting] = useState<CatalogProduct | null>(null);
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

  function openEdit(productId: string) {
    setEditingId(productId);
    setAdding(false);
  }

  function confirmDelete() {
    if (!deleting) return;
    const product = deleting;
    start(async () => {
      try {
        const result = await deleteProduct(product.id);
        if ("ok" in result) {
          if (editingId === product.id) setEditingId(null);
          setDeleting(null);
          adminNotifySuccess(
            result.hidden
              ? `${product.name} hidden — kept for past orders.`
              : `${product.name} deleted.`,
          );
          if (result.hidden) setTab("hidden");
          router.refresh();
        } else {
          adminNotifyError(result.error || "Could not delete.");
        }
      } catch {
        adminNotifyError("Could not delete. Check your connection and try again.");
      }
    });
  }

  function handleToggleActive(product: CatalogProduct) {
    start(async () => {
      const result = await withActionError(
        () => toggleProductActive(product.id),
        adminNotifyError,
        "Could not update visibility.",
      );
      if (!result) return;
      if ("error" in result && result.error) {
        adminNotifyError(result.error);
      } else {
        adminNotifySuccess(
          `${product.name} is now ${result.isActive ? "visible in the store" : "hidden"}.`,
        );
        router.refresh();
      }
    });
  }

  function handleAdjustStock(product: CatalogProduct, newStock: number) {
    if (newStock < 0) return;
    start(async () => {
      const result = await withActionError(
        () => updateProductStock(product.id, newStock),
        adminNotifyError,
        "Could not update stock.",
      );
      if (!result) return;
      if ("error" in result && result.error) {
        adminNotifyError(result.error);
      } else {
        adminNotifySuccess(`Stock updated for ${product.name} (${newStock} units).`);
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
              setAdding(true);
              setEditingId(null);
            }}
            className={adminButtonPrimary}
          >
            + New product
          </button>
        }
      />

      {products.length === 0 ? (
        <AdminEmptyState>Nothing is in the catalogue yet.</AdminEmptyState>
      ) : (
        <>
          <AdminListSearch
            value={query}
            onChange={setQuery}
            placeholder="Search catalogue…"
            countLabel={`${pagination.total} matching · ${products.length} total`}
          />
          <AdminFilterTabs
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "active", label: "Active", count: counts.active },
              { id: "hidden", label: "Hidden", count: counts.hidden },
              {
                id: "low_stock",
                label: "Low stock",
                count: counts.lowStock,
                tone: "attention",
              },
            ]}
          />

          {filtered.length === 0 ? (
            <AdminEmptyState>No products match this view.</AdminEmptyState>
          ) : (
            <PaginatedTableWrap
              pagination={pagination.tablePaginationProps("products")}
              scroll={false}
              clip={false}
            >
              <ul className="divide-y divide-deep/8">
                {pagination.visible.map((product) => {
                  const photo = product.images[0];
                  const isHidden = product.isActive === false;
                  const isLowStock = product.stock <= 5;
                  const hasDiscount =
                    product.compareAtPrice && product.compareAtPrice > product.price;

                  return (
                    <li
                      key={product.id}
                      className={`flex flex-col gap-3 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between ${
                        isHidden ? "bg-tint/20 opacity-80" : "hover:bg-cream/20"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-deep/10 bg-tint/40">
                          {photo ? (
                            <Image
                              src={photo.url}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
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
                              onClick: () => setDeleting(product),
                            },
                          ]}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </PaginatedTableWrap>
          )}
        </>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add new product"
        description="Upload pictures and set how many you have in stock."
        size="xl"
      >
        <AddProductForm
          library={library}
          onSuccess={() => {
            setAdding(false);
            adminNotifySuccess("Product added.");
          }}
          onError={adminNotifyError}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title={editing ? `Editing ${editing.name}` : "Edit product"}
        description="Update prices, ingredients, benefits, compare-at pricing, and pictures."
        size="xl"
      >
        {editing ? (
          <ProductEditor
            key={editing.id}
            product={editing}
            library={library}
            onSuccess={() => {
              setEditingId(null);
              adminNotifySuccess(`${editing.name} saved.`);
            }}
            onError={adminNotifyError}
            onDelete={() => {
              setDeleting(editing);
            }}
          />
        ) : null}
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        title={deleting ? `Delete ${deleting.name}?` : "Delete product"}
        description="If this product is on past orders it is hidden instead of removed, so order history stays intact."
        confirmLabel="Delete product"
        danger
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
