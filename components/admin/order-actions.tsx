"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import { adminButtonPrimary, interactiveControl } from "@/components/ui/form-styles";
import {
  fulfillmentLabel,
  nextOrderStep,
  orderSteps,
  type AdminFulfillment,
  type AdminOrderStatus,
} from "@/lib/admin-orders";

export function OrderActions({
  id,
  status,
  fulfillment,
  paymentStatus,
}: {
  id: string;
  status: AdminOrderStatus;
  fulfillment: AdminFulfillment;
  paymentStatus?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const next = nextOrderStep(status, fulfillment);
  const steps = orderSteps(fulfillment);
  const current = steps.indexOf(status);
  const done = status === "DELIVERED" || status === "CANCELLED";

  function apply(nextStatus: AdminOrderStatus) {
    start(async () => {
      const result = await updateOrderStatus(id, nextStatus);
      setMessage("error" in result && result.error ? result.error : "");
      if ("ok" in result) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const reached = status === "CANCELLED" ? false : index <= current;
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  reached ? "bg-deep text-cream" : "bg-deep/8 text-deep/35"
                }`}
              >
                {reached && index < current ? <Check className="size-3" aria-hidden /> : index + 1}
              </span>
              <span className={`truncate text-[11px] ${reached ? "text-deep" : "text-deep/40"}`}>
                {fulfillmentLabel(step, fulfillment)}
              </span>
              {index < steps.length - 1 ? (
                <span className={`h-px flex-1 ${index < current ? "bg-deep/30" : "bg-deep/10"}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="text-sm text-deep/60">
        Payment {paymentStatus === "PAID" ? "received" : "not confirmed"}.
        {status === "CANCELLED" ? " This order was cancelled." : null}
        {status === "DELIVERED"
          ? fulfillment === "PICKUP"
            ? " Collected."
            : " Delivered."
          : null}
      </p>

      {next ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => apply(next.status)}
          className={adminButtonPrimary}
        >
          {pending ? "Saving…" : next.label}
        </button>
      ) : null}

      {!done ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Cancel this order? The customer will be emailed.")) return;
            apply("CANCELLED");
          }}
          className={`text-xs text-deep/45 underline-offset-2 hover:text-red-700 hover:underline ${interactiveControl}`}
        >
          Cancel order
        </button>
      ) : null}

      {message ? <p className="text-xs text-red-700">{message}</p> : null}
    </div>
  );
}
