"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";

type OrderStatus = "PENDING" | "PAID" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

const nextStep: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PAID: { status: "PACKED", label: "Mark packed" },
  PACKED: { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark delivered" },
};

export function OrderActions({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: OrderStatus;
  paymentStatus?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const paid = paymentStatus === "PAID" || status !== "PENDING";

  if (status === "CANCELLED") {
    return <p className="text-sm text-deep/60">This order was cancelled.</p>;
  }

  if (!paid) {
    return (
      <p className="text-sm text-deep/60">
        Waiting for Paystack payment. No action needed — it updates automatically when the customer
        pays.
      </p>
    );
  }

  if (status === "DELIVERED") {
    return <p className="text-sm text-deep/60">Delivered. Nothing left to do here.</p>;
  }

  const step = nextStep[status];

  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] text-sage uppercase">
        {status.replaceAll("_", " ")}
      </p>
      <p className="mt-2 text-sm text-deep/60">
        Paystack already confirmed payment. You only manage packing and delivery from here.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {step ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const result = await updateOrderStatus(id, step.status);
                setMessage("error" in result && result.error ? result.error : "Customer emailed.");
                if ("ok" in result) router.refresh();
              });
            }}
            className="rounded-lg bg-deep px-3 py-2 text-[11px] tracking-[0.12em] text-cream uppercase"
          >
            {step.label}
          </button>
        ) : null}
        <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const result = await updateOrderStatus(id, "CANCELLED");
                setMessage("error" in result && result.error ? result.error : "Order cancelled.");
                if ("ok" in result) router.refresh();
              });
            }}
            className="rounded-lg border border-deep/20 px-3 py-2 text-[11px] tracking-[0.12em] text-deep/70 uppercase"
          >
            Cancel
          </button>
      </div>
      {message ? <p className="mt-3 text-sm text-deep/70">{message}</p> : null}
    </div>
  );
}
