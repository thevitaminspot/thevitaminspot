"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createZone, deleteZone, updateZone } from "@/actions/admin";
import { adminFormControl, adminFormField, adminFormLabel } from "@/components/ui/form-styles";

export function ZoneForm({
  id,
  feeNaira,
  eta,
  isActive,
}: {
  id: string;
  feeNaira: number;
  eta: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateZone({
            id,
            feeNaira: Number(data.get("fee")),
            eta: String(data.get("eta") ?? ""),
            isActive: data.get("active") === "on",
          });
          setMessage("error" in result && result.error ? result.error : "Saved.");
          if ("ok" in result) router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs text-deep/50">₦</span>
        <input
          name="fee"
          type="number"
          min={0}
          defaultValue={feeNaira}
          aria-label="Fee in naira"
          className={`${adminFormControl} w-28`}
        />
      </div>
      <input
        name="eta"
        defaultValue={eta}
        aria-label="Delivery window"
        placeholder="e.g. Same day (2-4 hrs)"
        className={`${adminFormControl} w-44`}
      />
      <label className="flex items-center gap-2 text-sm text-deep/80">
        <input type="checkbox" name="active" defaultChecked={isActive} className="accent-deep" />
        Active
      </label>
      <button
        disabled={pending}
        className="rounded-lg bg-deep px-3 py-2 text-[11px] tracking-[0.12em] text-cream uppercase transition hover:bg-sage disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Remove this delivery zone?")) return;
          start(async () => {
            const res = await deleteZone(id);
            if ("ok" in res) router.refresh();
            else setMessage(res.error || "Failed to delete");
          });
        }}
        className="rounded-lg border border-red-200 px-3 py-2 text-[11px] tracking-[0.12em] text-red-600 uppercase transition hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
      {message ? <span className="text-xs text-deep/60">{message}</span> : null}
    </form>
  );
}

export function AddZoneForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-deep px-4 py-2.5 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-sage"
      >
        + Add New Delivery Zone
      </button>
    );
  }

  return (
    <form
      className="mt-4 rounded-xl border border-deep/15 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await createZone({
            name: String(data.get("name") ?? ""),
            feeNaira: Number(data.get("fee") ?? 0),
            eta: String(data.get("eta") ?? "Same day"),
            isActive: data.get("active") === "on",
          });
          if ("ok" in result) {
            setMessage("Zone created successfully.");
            setOpen(false);
            router.refresh();
          } else {
            setMessage(result.error || "Failed to create zone.");
          }
        });
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-deep/10">
        <h3 className="font-display text-xl text-deep">New Delivery Zone</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs uppercase tracking-wider text-deep/50 hover:text-deep"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={adminFormLabel}>
            Zone Name / District
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Asokoro, Guzape, Jabi"
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel}>
            Fee in Naira (₦)
          </label>
          <input
            name="fee"
            type="number"
            min={0}
            required
            placeholder="e.g. 3500"
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel}>
            Estimated Delivery Time
          </label>
          <input
            name="eta"
            required
            placeholder="e.g. Same day (2-4 hrs)"
            defaultValue="Same day delivery"
            className={adminFormField}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3">
        <label className="flex items-center gap-2 text-sm text-deep/80">
          <input type="checkbox" name="active" defaultChecked className="accent-deep" />
          Active immediately for checkout
        </label>
        <button
          disabled={pending}
          className="rounded-lg bg-deep px-5 py-2.5 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-sage disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create Zone"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-deep/70">{message}</p> : null}
    </form>
  );
}
