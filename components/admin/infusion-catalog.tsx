"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleInfusionActive } from "@/actions/admin";
import { AddInfusionForm, InfusionEditor } from "@/components/admin/editors";
import { InfusionDeleteConfirm } from "@/components/admin/infusion-delete-confirm";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { AdminEmptyState, AdminFormPanel, AdminPageHeader } from "@/components/admin/ui";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { useScrollIntoView } from "@/components/admin/use-scroll-into-view";
import { adminButtonPrimary, adminButtonTab } from "@/components/ui/form-styles";
import { SearchField } from "@/components/ui/search-field";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";

export function InfusionCatalog({
  infusions,
  library,
}: {
  infusions: CatalogInfusion[];
  library: string[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CatalogInfusion | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "live" | "hidden">("all");
  const [pending, start] = useTransition();

  const counts = useMemo(
    () => ({
      all: infusions.length,
      live: infusions.filter((item) => item.isActive !== false).length,
      hidden: infusions.filter((item) => item.isActive === false).length,
    }),
    [infusions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return infusions.filter((item) => {
      const matchesQuery =
        !q ||
        `${item.name} ${item.tagline} ${item.description} ${item.ingredients.join(" ")} ${item.benefits.join(" ")}`
          .toLowerCase()
          .includes(q);

      if (!matchesQuery) return false;
      if (tab === "live") return item.isActive !== false;
      if (tab === "hidden") return item.isActive === false;
      return true;
    });
  }, [infusions, query, tab]);

  const pagination = usePaginatedList(filtered, `${tab}:${query}`);
  const editing = infusions.find((item) => item.id === editingId);
  const addFormRef = useScrollIntoView<HTMLDivElement>(adding ? "add" : null);
  const editFormRef = useScrollIntoView<HTMLDivElement>(editingId);

  function openEdit(id: string) {
    setEditingId(id);
    setAdding(false);
  }

  function restore(item: CatalogInfusion) {
    start(async () => {
      const result = await toggleInfusionActive(item.id);
      if ("error" in result && result.error) {
        adminNotifyError(result.error);
      } else {
        adminNotifySuccess(`${item.name} is live on the booking page again.`);
      }
      if ("ok" in result) router.refresh();
    });
  }

  const showCatalog = infusions.length > 0 || adding || editing;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Clinic"
        title="Infusions"
        description="Manage session pricing, deposits, and duration. Prices are in naira."
        action={
          <button
            type="button"
            onClick={() => {
              setAdding((value) => !value);
              if (!adding) setEditingId(null);
            }}
            className={adminButtonPrimary}
          >
            {adding ? "Close form" : "+ Add session"}
          </button>
        }
      />

      {infusions.length === 0 && !adding ? (
        <AdminEmptyState>Add a session to populate the booking page.</AdminEmptyState>
      ) : null}

      {showCatalog ? (
        <div className="space-y-6">
          {adding ? (
            <div ref={addFormRef}>
              <AdminFormPanel
                title="Add session"
                description="Set what guests see on the booking page."
                onCancel={() => setAdding(false)}
              >
                <AddInfusionForm
                  library={library}
                  onSuccess={() => {
                    setAdding(false);
                    adminNotifySuccess("Session added.");
                  }}
                  onError={adminNotifyError}
                />
              </AdminFormPanel>
            </div>
          ) : null}

          {editing ? (
            <div ref={editFormRef}>
              <AdminFormPanel
                title={`Editing ${editing.name}`}
                description="Update pricing, duration, deposit, and what the booking page shows."
                onCancel={() => setEditingId(null)}
              >
                <InfusionEditor
                  key={editing.id}
                  infusion={editing}
                  library={library}
                  onSuccess={() => {
                    setEditingId(null);
                    adminNotifySuccess(`${editing.name} saved.`);
                  }}
                  onError={adminNotifyError}
                  onDelete={() => setDeleting(editing)}
                />
              </AdminFormPanel>
            </div>
          ) : null}

          {infusions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-deep/10 bg-white">
              <div className="flex flex-col gap-4 border-b border-deep/10 bg-cream/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
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
                    onClick={() => setTab("live")}
                    className={`${adminButtonTab} ${
                      tab === "live" ? "bg-deep text-cream" : "text-deep/70 hover:bg-tint"
                    }`}
                  >
                    Live ({counts.live})
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
                </div>

                <SearchField
                  value={query}
                  onChange={setQuery}
                  placeholder="Search sessions…"
                  variant="admin"
                  className="min-w-[220px]"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center text-xs text-deep/60">
                  No sessions match the selected criteria.
                </div>
              ) : (
                <div>
                  <TablePagination {...pagination.tablePaginationProps("sessions")} edge="top" />
                  <ul className="divide-y divide-deep/10">
                    {pagination.visible.map((item) => {
                      const hidden = item.isActive === false;
                      const isEditing = editingId === item.id;
                      return (
                        <li
                          key={item.id}
                          className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                            hidden ? "bg-tint/20 opacity-80" : ""
                          } ${isEditing ? "bg-sage/10 ring-1 ring-inset ring-sage/30" : ""}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-deep">{item.name}</p>
                              {hidden ? (
                                <span className="rounded-full bg-deep/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] text-deep/60 uppercase">
                                  Hidden
                                </span>
                              ) : (
                                <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] text-deep uppercase">
                                  Live
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-deep/55">
                              {nairaLabel(item.price)} · deposit {nairaLabel(item.deposit)} ·{" "}
                              {item.durationMin} min
                              {(item.appointmentCount ?? 0) > 0
                                ? ` · ${item.appointmentCount} booking${item.appointmentCount === 1 ? "" : "s"}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {hidden ? (
                              <button
                                type="button"
                                disabled={pending}
                                className="cursor-pointer rounded-lg border border-deep/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => restore(item)}
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="cursor-pointer rounded-lg border border-deep/15 px-3 py-2 text-sm"
                                onClick={() => openEdit(item.id)}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={pending}
                              className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => setDeleting(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <TablePagination {...pagination.tablePaginationProps("sessions")} edge="bottom" />
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <InfusionDeleteConfirm infusion={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
