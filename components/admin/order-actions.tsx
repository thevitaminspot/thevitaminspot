"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";
import { AdminStatusBadge } from "@/components/admin/ui";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type FulfillmentMethod = "DELIVERY" | "PICKUP";

const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Paid" },
  { status: "PACKED", label: "Packed" },
  { status: "OUT_FOR_DELIVERY", label: "En route" },
  { status: "DELIVERED", label: "Delivered" },
];

const PICKUP_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Paid" },
  { status: "PACKED", label: "Ready" },
  { status: "DELIVERED", label: "Picked up" },
];

const DELIVERY_OPTIONS: { status: OrderStatus; label: string }[] = [
  { status: "PACKED", label: "Packed" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

const PICKUP_OPTIONS: { status: OrderStatus; label: string }[] = [
  { status: "PACKED", label: "Ready for pickup" },
  { status: "DELIVERED", label: "Picked up" },
];

const stepIndex = (status: OrderStatus, steps: { status: OrderStatus }[]) =>
  steps.findIndex((step) => step.status === status);

export function OrderActions({
  id,
  status,
  paymentStatus,
  paystackReference,
  fulfillment,
}: {
  id: string;
  status: OrderStatus;
  paymentStatus?: string | null;
  paystackReference?: string | null;
  fulfillment: FulfillmentMethod;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const pickup = fulfillment === "PICKUP";
  const steps = pickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const options = pickup ? PICKUP_OPTIONS : DELIVERY_OPTIONS;
  const paid = paymentStatus === "PAID" || status !== "PENDING";
  const currentIdx = stepIndex(status, steps);

  function setStatus(next: OrderStatus) {
    if (next === status) return;
    start(async () => {
      const result = await updateOrderStatus(id, next);
      setMessage("error" in result && result.error ? result.error : "");
      if ("ok" in result) router.refresh();
    });
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-deep/10 bg-deep/[0.03] px-4 py-3.5">
        <p className="text-sm text-deep/60">This order was cancelled.</p>
      </div>
    );
  }

  if (!paid) {
    return (
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3.5">
        <p className="text-sm text-deep/70">
          Waiting for Paystack payment — status updates automatically when the customer pays.
        </p>
      </div>
    );
  }

  if (status === "DELIVERED") {
    return (
      <div className="min-w-0 space-y-4">
        <FulfillmentPipeline steps={steps} currentIdx={steps.length - 1} />
        <PaymentRow paymentStatus={paymentStatus} paystackReference={paystackReference} />
        <p className="text-sm text-deep/55">
          {pickup ? "Picked up. All done." : "Delivered. All done."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminStatusBadge status={status} />

      <FulfillmentPipeline steps={steps} currentIdx={currentIdx} />

      <PaymentRow paymentStatus={paymentStatus} paystackReference={paystackReference} />

      <div className="space-y-2 pt-1">
        <p className="text-[10px] tracking-[0.14em] text-deep/45 uppercase">Set status</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = status === option.status;
            return (
              <button
                key={option.status}
                type="button"
                disabled={pending || active}
                onClick={() => setStatus(option.status)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-[11px] tracking-[0.1em] uppercase transition disabled:cursor-not-allowed ${
                  active
                    ? "bg-deep text-cream"
                    : "border border-deep/15 text-deep/70 hover:border-deep/30 hover:bg-cream/40 disabled:opacity-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Cancel this order? The customer will be notified.")) return;
          setStatus("CANCELLED");
        }}
        className="cursor-pointer text-[11px] tracking-[0.1em] text-deep/45 uppercase transition hover:text-red-600 disabled:cursor-not-allowed"
      >
        Cancel order
      </button>

      {message ? <p className="text-xs text-red-600">{message}</p> : null}
    </div>
  );
}

function FulfillmentPipeline({
  steps,
  currentIdx,
}: {
  steps: { status: OrderStatus; label: string }[];
  currentIdx: number;
}) {
  return (
    <ol className="flex min-w-0 items-center gap-0 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const done = index <= currentIdx;
        const active = index === currentIdx;
        return (
          <li key={step.status} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition ${
                  done
                    ? "bg-deep text-cream"
                    : "border border-deep/15 bg-white text-deep/35"
                } ${active && done ? "ring-2 ring-sage/40 ring-offset-1" : ""}`}
              >
                {done && index < currentIdx ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`truncate text-center text-[10px] tracking-[0.06em] uppercase ${
                  done ? "font-medium text-deep" : "text-deep/40"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={`mx-1 mb-5 h-px flex-1 ${index < currentIdx ? "bg-deep/30" : "bg-deep/10"}`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function PaymentRow({
  paymentStatus,
  paystackReference,
}: {
  paymentStatus?: string | null;
  paystackReference?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-deep/10 bg-cream/30 px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 shrink-0 text-sage" />
        <span className="font-medium text-deep">Paystack · {paymentStatus ?? "Unpaid"}</span>
      </div>
      {paystackReference ? (
        <p
          className="mt-1.5 break-all font-mono text-[10px] leading-relaxed text-deep/50"
          title={paystackReference}
        >
          Ref: {paystackReference}
        </p>
      ) : null}
    </div>
  );
}
