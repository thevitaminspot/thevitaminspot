"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createZone } from "@/actions/admin";
import { AdminFormPanel } from "@/components/admin/ui";
import { adminFormField, adminFormLabel } from "@/components/ui/form-styles";

export function AddZonePanel({
  onCancel,
  onSuccess,
  onError,
}: {
  onCancel: () => void;
  onSuccess?: (name: string) => void;
  onError?: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <AdminFormPanel
      title="New delivery zone"
      description="Abuja district, courier fee, and estimated delivery time."
      onCancel={onCancel}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get("name") ?? "");
          start(async () => {
            const result = await createZone({
              name,
              feeNaira: Number(data.get("fee") ?? 0),
              eta: String(data.get("eta") ?? "Same day"),
              isActive: data.get("active") === "on",
            });
            if ("ok" in result) {
              router.refresh();
              onSuccess?.(name);
            } else {
              onError?.(result.error || "Failed to create zone.");
            }
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={adminFormLabel}>Zone name / district</label>
            <input
              name="name"
              required
              placeholder="e.g. Asokoro, Guzape, Jabi"
              className={adminFormField}
            />
          </div>
          <div>
            <label className={adminFormLabel}>Fee in naira (₦)</label>
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
            <label className={adminFormLabel}>Estimated delivery time</label>
            <input
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
            <input type="checkbox" name="active" defaultChecked className="accent-deep" />
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
    </AdminFormPanel>
  );
}
