"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { adminButtonPrimary, interactiveControl } from "@/components/ui/form-styles";
import {
  fulfillmentLabel,
  nextOrderStep,
  orderSteps,
  type AdminFulfillment,
  type AdminOrderStatus,
} from "@/lib/admin-orders";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";

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
  const [pending, start] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const next = nextOrderStep(status, fulfillment);
  const steps = orderSteps(fulfillment);
  const current = steps.indexOf(status);
  const done = status === "DELIVERED" || status === "CANCELLED";

  function apply(nextStatus: AdminOrderStatus) {
    start(async () => {
      const result = await updateOrderStatus(id, nextStatus);
      if ("error" in result && result.error) {
        adminNotifyError(result.error);
        return;
      }
      adminNotifySuccess(
        nextStatus === "CANCELLED" ? "Order cancelled." : "Order updated.",
      );
      setCancelOpen(false);
      router.refresh();
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

      <div className="flex flex-wrap items-center gap-3">
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
        <OrderStatusSelect id={id} status={status} fulfillment={fulfillment} />
      </div>

      {!done ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setCancelOpen(true)}
          className={`text-xs text-deep/45 underline-offset-2 hover:text-red-700 hover:underline ${interactiveControl}`}
        >
          Cancel order
        </button>
      ) : null}

      <ConfirmModal
        open={cancelOpen}
        title="Cancel this order?"
        description="The customer will be emailed. This cannot be undone from the admin panel."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        pending={pending}
        onConfirm={() => apply("CANCELLED")}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
