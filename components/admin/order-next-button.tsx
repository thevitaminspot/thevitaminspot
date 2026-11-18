"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import { adminButtonPrimary } from "@/components/ui/form-styles";
import { nextOrderStep, type AdminOrderStatus } from "@/lib/admin-orders";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { withActionError } from "@/lib/server-action-error";

export function OrderNextButton({
  id,
  status,
  fulfillment,
}: {
  id: string;
  status: string;
  fulfillment: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = nextOrderStep(
    status as AdminOrderStatus,
    fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY",
  );

  if (!next) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const result = await withActionError(
            () => updateOrderStatus(id, next.status),
            adminNotifyError,
            "Could not update order.",
          );
          if (!result) return;
          if ("error" in result && result.error) {
            adminNotifyError(result.error);
            return;
          }
          adminNotifySuccess("Order updated.");
          router.refresh();
        });
      }}
      className={adminButtonPrimary}
    >
      {pending ? "Saving…" : next.label}
    </button>
  );
}
