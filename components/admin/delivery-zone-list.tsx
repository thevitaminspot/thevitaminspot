"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteZone, updateZone } from "@/actions/admin";
import { AdminActionMenu } from "@/components/admin/action-menu";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import {
  AdminEmptyState,
  AdminFilterTabs,
} from "@/components/admin/ui";
import {
  type DeliveryRegion,
  deliveryRegionForSlug,
  partitionZones,
} from "@/lib/delivery-regions";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { Modal } from "@/components/ui/modal";
import { adminFormField, adminFormLabel } from "@/components/ui/form-styles";
import { formatNaira } from "@/lib/money";

type Zone = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  eta: string;
  isActive: boolean;
};

const regionLabels: Record<DeliveryRegion, string> = {
  abuja: "Abuja",
  nigeria: "Elsewhere in Nigeria",
  international: "International",
};

export function DeliveryZoneList({
  zones,
  onMessage,
}: {
  zones: Zone[];
  onMessage?: (message: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<DeliveryRegion | "all">("all");
  const [editing, setEditing] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState<Zone | null>(null);
  const setMessage = (value: string) => {
    onMessage?.(value);
  };
  const [pending, start] = useTransition();

  const grouped = useMemo(() => partitionZones(zones), [zones]);

  const scoped = useMemo(() => {
    if (region === "all") return zones;
    if (region === "abuja") return grouped.abuja;
    if (region === "nigeria") return grouped.nigeria;
    return grouped.international;
  }, [zones, region, grouped]);

  const filtered = useMemo(
    () =>
      filterByQuery(
        scoped,
        query,
        (zone) => `${zone.name} ${zone.slug} ${zone.eta} ${regionLabels[deliveryRegionForSlug(zone.slug)]}`,
      ),
    [scoped, query],
  );

  const pagination = usePaginatedList(filtered, `${region}:${query}`);

  function toggleActive(zone: Zone) {
    start(async () => {
      const result = await updateZone({
        id: zone.id,
        feeNaira: Math.round(zone.fee / 100),
        eta: zone.eta,
        isActive: !zone.isActive,
      });
      setMessage("error" in result && result.error ? result.error : `${zone.name} updated.`);
      if ("ok" in result) router.refresh();
    });
  }

  function confirmRemove() {
    if (!deleting) return;
    const zone = deleting;
    start(async () => {
      const result = await deleteZone(zone.id);
      if ("ok" in result) {
        setDeleting(null);
        setMessage(`${zone.name} removed.`);
        router.refresh();
      } else {
        setMessage(result.error || "Could not remove zone.");
      }
    });
  }

  return (
    <div>
      {zones.length === 0 ? (
        <AdminEmptyState>No delivery zones yet.</AdminEmptyState>
      ) : (
        <>
          <AdminListSearch
            value={query}
            onChange={setQuery}
            placeholder="Search by location…"
            countLabel={`${pagination.total} matching · ${zones.length} total`}
          />
          <AdminFilterTabs
            value={region}
            onChange={(id) => setRegion(id as DeliveryRegion | "all")}
            tabs={[
              { id: "all", label: "All", count: zones.length },
              { id: "abuja", label: "Abuja", count: grouped.abuja.length },
              { id: "nigeria", label: "Other cities", count: grouped.nigeria.length },
              {
                id: "international",
                label: "Countries",
                count: grouped.international.length,
              },
            ]}
          />

          {filtered.length === 0 ? (
            <AdminEmptyState>No locations match this view.</AdminEmptyState>
          ) : (
            <PaginatedTableWrap
              pagination={pagination.tablePaginationProps("zones")}
              scroll={false}
              clip={false}
            >
              <ul className="divide-y divide-deep/8">
                {pagination.visible.map((zone) => {
                  const zoneRegion = deliveryRegionForSlug(zone.slug);
                  return (
                    <li
                      key={zone.id}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-deep">{zone.name}</span>
                          <span className="inline-flex rounded-full bg-cream px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-deep/55 uppercase ring-1 ring-deep/10 ring-inset">
                            {regionLabels[zoneRegion]}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.12em] uppercase ring-1 ring-inset ${
                              zone.isActive
                                ? "bg-sage/15 text-deep ring-sage/30"
                                : "bg-deep/[0.04] text-deep/50 ring-deep/10"
                            }`}
                          >
                            {zone.isActive ? "Live" : "Off"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-deep/50">
                          {formatNaira(zone.fee)} · {zone.eta}
                        </p>
                      </div>

                      <AdminActionMenu
                        label={`Options for ${zone.name}`}
                        disabled={pending}
                        items={[
                          {
                            label: "Edit zone",
                            onClick: () => setEditing(zone),
                          },
                          {
                            label: zone.isActive ? "Turn off" : "Turn on",
                            disabled: pending,
                            onClick: () => toggleActive(zone),
                          },
                          {
                            label: "Delete zone",
                            tone: "danger",
                            disabled: pending,
                            onClick: () => setDeleting(zone),
                          },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            </PaginatedTableWrap>
          )}
        </>
      )}

      <ZoneEditModal
        zone={editing}
        pending={pending}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (!editing) return;
          start(async () => {
            const result = await updateZone({ id: editing.id, ...data });
            if ("ok" in result) {
              const name = editing.name;
              setEditing(null);
              setMessage(`${name} saved.`);
              router.refresh();
            } else {
              setMessage(result.error || "Failed to save.");
            }
          });
        }}
      />

      <ConfirmModal
        open={Boolean(deleting)}
        title={deleting ? `Remove ${deleting.name}?` : "Remove zone"}
        description="Existing orders keep their zone reference. This only removes the zone from checkout."
        confirmLabel="Remove zone"
        danger
        pending={pending}
        onConfirm={confirmRemove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function ZoneEditModal({
  zone,
  pending,
  onClose,
  onSave,
}: {
  zone: Zone | null;
  pending: boolean;
  onClose: () => void;
  onSave: (data: { feeNaira: number; eta: string; isActive: boolean }) => void;
}) {
  if (!zone) return null;

  return (
    <Modal
      open={Boolean(zone)}
      onClose={onClose}
      title={`Edit ${zone.name}`}
      description={`${regionLabels[deliveryRegionForSlug(zone.slug)]} · courier fee, ETA, and checkout visibility.`}
      size="md"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            feeNaira: Number(data.get("fee")),
            eta: String(data.get("eta") ?? ""),
            isActive: data.get("active") === "on",
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className={adminFormLabel} htmlFor="zone-fee">
            Delivery fee (₦)
          </label>
          <input
            id="zone-fee"
            name="fee"
            type="number"
            min={0}
            required
            defaultValue={Math.round(zone.fee / 100)}
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel} htmlFor="zone-eta">
            Estimated delivery time
          </label>
          <input
            id="zone-eta"
            name="eta"
            required
            defaultValue={zone.eta}
            placeholder="e.g. Same day (2–4 hrs)"
            className={adminFormField}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-deep/80">
          <input
            id="zone-active"
            type="checkbox"
            name="active"
            defaultChecked={zone.isActive}
            className="accent-deep"
          />
          Active at checkout
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-lg bg-deep px-4 py-2.5 text-[11px] tracking-[0.12em] text-cream uppercase disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-deep/15 px-4 py-2.5 text-[11px] tracking-[0.12em] text-deep/60 uppercase"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
