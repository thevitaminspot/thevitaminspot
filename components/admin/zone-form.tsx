"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createZone } from "@/actions/admin";
import { adminFormField, adminFormLabel } from "@/components/ui/form-styles";
import { withActionError } from "@/lib/server-action-error";

export function AddZoneForm({
  onSuccess,
  onError,
}: {
  onSuccess?: (name: string) => void;
  onError?: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        if (!name) {
          onError?.("Enter a zone name.");
          return;
        }
        const feeNaira = Number(data.get("fee") ?? 0);
        if (!Number.isFinite(feeNaira) || feeNaira < 0) {
          onError?.("Enter a valid fee in naira.");
          return;
        }
        start(async () => {
          const result = await withActionError(
            () =>
              createZone({
                name,
                feeNaira,
                eta: String(data.get("eta") ?? "Same day"),
                isActive: data.get("active") === "on",
              }),
            (message) => onError?.(message),
            "Failed to create zone.",
          );
          if (!result) return;
          if ("ok" in result) {
            router.refresh();
            onSuccess?.(name);
          } else {
            onError?.(result.error || "Failed to create zone.");
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={adminFormLabel} htmlFor="zone-name">
            Zone name
          </label>
          <input
            id="zone-name"
            name="name"
            required
            placeholder="e.g. Asokoro, Lagos, Accra"
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel} htmlFor="zone-fee-new">
            Fee in naira (₦)
          </label>
          <input
            id="zone-fee-new"
            name="fee"
            type="number"
            min={0}
            required
            placeholder="e.g. 3500"
            className={adminFormField}
          />
        </div>
        <div>
          <label className={adminFormLabel} htmlFor="zone-eta-new">
            Estimated delivery time
          </label>
          <input
            id="zone-eta-new"
            name="eta"
            required
            placeholder="e.g. Same day (2–4 hrs)"
            defaultValue="Same day delivery"
            className={adminFormField}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2 text-sm text-deep/80">
          <input
            id="zone-active-new"
            type="checkbox"
            name="active"
            defaultChecked
            className="accent-deep"
          />
          Active at checkout
        </label>
        <button
          disabled={pending}
          className="cursor-pointer rounded-lg bg-deep px-5 py-2.5 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create zone"}
        </button>
      </div>
    </form>
  );
}

/** @deprecated Prefer AddZoneForm inside Modal */
export const AddZonePanel = AddZoneForm;
