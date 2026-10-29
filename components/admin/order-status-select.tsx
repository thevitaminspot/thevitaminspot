"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import {
  fulfillmentLabel,
  orderSteps,
  type AdminFulfillment,
  type AdminOrderStatus,
} from "@/lib/admin-orders";

export function OrderStatusSelect({
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
  const method: AdminFulfillment = fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY";
  const steps = orderSteps(method);
  const current = status as AdminOrderStatus;
  if (!steps.includes(current)) return null;

  return (
    <select
      aria-label="Order status"
      value={current}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as AdminOrderStatus;
        if (next === current) return;
        start(async () => {
          const result = await updateOrderStatus(id, next);
          if ("ok" in result) router.refresh();
        });
      }}
      className="max-w-full rounded-lg border border-deep/15 bg-white px-2 py-1.5 text-xs text-deep"
    >
      {steps.map((step) => (
        <option key={step} value={step}>
          {fulfillmentLabel(step, method)}
        </option>
      ))}
    </select>
  );
}
