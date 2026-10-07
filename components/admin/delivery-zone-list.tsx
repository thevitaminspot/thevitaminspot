"use client";

import { Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteZone, updateZone } from "@/actions/admin";
import { AdminActionMenu } from "@/components/admin/action-menu";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";
import { Modal } from "@/components/ui/modal";
import { adminFormField, adminFormLabel, adminFormSearch } from "@/components/ui/form-styles";
import { formatNaira } from "@/lib/money";

type Zone = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  eta: string;
  isActive: boolean;
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
  const [editing, setEditing] = useState<Zone | null>(null);
  const [localMessage, setLocalMessage] = useState("");
  const message = localMessage;
  const setMessage = (value: string) => {
    setLocalMessage(value);
    onMessage?.(value);
  };
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (zone) =>
        zone.name.toLowerCase().includes(q) ||
        zone.slug.toLowerCase().includes(q) ||
        zone.eta.toLowerCase().includes(q),
    );
  }, [zones, query]);

  const list = useCollapsibleList(filtered, { resetKey: query });

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

  function remove(zone: Zone) {
    if (!window.confirm(`Remove ${zone.name}? Existing orders keep their zone reference.`)) return;
    start(async () => {
      const result = await deleteZone(zone.id);
      setMessage("error" in result && result.error ? result.error : `${zone.name} removed.`);
      if ("ok" in result) router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-deep/8 bg-cream/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">
          {filtered.length} of {zones.length} locations
        </p>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-deep/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by location…"
            className={adminFormSearch}
          />
        </div>
      </div>

      {message && !onMessage ? (
        <p className="border-b border-deep/6 px-5 py-2.5 text-xs text-deep/60">{message}</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-deep/55">
          No locations match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="divide-y divide-deep/6">
          {list.visible.map((zone) => (
            <li
              key={zone.id}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/20"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-deep">{zone.name}</span>
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
                    onClick: () => remove(zone),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      {list.collapsible ? (
        <AdminShowMoreFooter
          expanded={list.expanded}
          total={list.total}
          hiddenCount={list.hiddenCount}
          label="locations"
          onToggle={() => list.setExpanded((value) => !value)}
        />
      ) : null}

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
    <Modal open={Boolean(zone)} onClose={onClose} title={`Edit ${zone.name}`}>
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
          <label className={adminFormLabel}>Delivery fee (₦)</label>
          <input
            name="fee"
            type="number"
            min={0}
            required
            defaultValue={Math.round(zone.fee / 100)}
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel}>Estimated delivery time</label>
          <input
            name="eta"
            required
            defaultValue={zone.eta}
            placeholder="e.g. Same day (2–4 hrs)"
            className={adminFormField}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-deep/80">
          <input
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
