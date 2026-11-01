"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleInfusionActive } from "@/actions/admin";
import { AddInfusionForm, InfusionEditor } from "@/components/admin/editors";
import { InfusionDeleteConfirm } from "@/components/admin/infusion-delete-confirm";
import { AdminListSearch } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { AdminEmptyState, AdminFilterTabs, AdminPageHeader } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { adminButtonPrimary } from "@/components/ui/form-styles";
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
              setAdding(true);
              setEditingId(null);
            }}
            className={adminButtonPrimary}
          >
            + Add session
          </button>
        }
      />

      {infusions.length === 0 ? (
        <AdminEmptyState>Add a session to populate the booking page.</AdminEmptyState>
      ) : (
        <>
          <AdminListSearch
            value={query}
            onChange={setQuery}
            placeholder="Search sessions…"
            countLabel={`${pagination.total} matching · ${infusions.length} total`}
          />
          <AdminFilterTabs
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "live", label: "Live", count: counts.live },
              { id: "hidden", label: "Hidden", count: counts.hidden },
            ]}
          />

          {filtered.length === 0 ? (
            <AdminEmptyState>No sessions match this view.</AdminEmptyState>
          ) : (
            <PaginatedTableWrap
              pagination={pagination.tablePaginationProps("sessions")}
              scroll={false}
            >
              <ul className="divide-y divide-deep/8">
                {pagination.visible.map((item) => {
                  const hidden = item.isActive === false;
                  return (
                    <li
                      key={item.id}
                      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        hidden ? "bg-tint/20 opacity-80" : ""
                      }`}
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
            </PaginatedTableWrap>
          )}
        </>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add session"
        description="Set what guests see on the booking page."
        size="xl"
      >
        <AddInfusionForm
          library={library}
          onSuccess={() => {
            setAdding(false);
            adminNotifySuccess("Session added.");
          }}
          onError={adminNotifyError}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title={editing ? `Editing ${editing.name}` : "Edit session"}
        description="Update pricing, duration, deposit, and what the booking page shows."
        size="xl"
      >
        {editing ? (
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
        ) : null}
      </Modal>

      <InfusionDeleteConfirm infusion={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
