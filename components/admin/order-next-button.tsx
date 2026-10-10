"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import { adminButtonPrimary } from "@/components/ui/form-styles";
import { nextOrderStep, type AdminOrderStatus } from "@/lib/admin-orders";

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
          const result = await updateOrderStatus(id, next.status);
          if ("ok" in result) router.refresh();
        });
      }}
      className={adminButtonPrimary}
    >
      {pending ? "Saving…" : next.label}
    </button>
  );
}
