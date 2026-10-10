"use client";

import { useState } from "react";
import { resumeOrderPayment } from "@/actions/checkout";
import { formSubmitInline } from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import { surfaceMuted } from "@/components/ui/layout-styles";

export function OrderPaymentActions({
  token,
  paymentStatus,
  orderStatus,
  confirming = false,
}: {
  token: string;
  paymentStatus?: string | null;
  orderStatus: string;
  confirming?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (orderStatus === "PAID" || paymentStatus === "PAID") return null;
  if (["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) return null;
  if (orderStatus === "CANCELLED") return null;

  return (
    <div className={`${surfaceMuted} mt-8 p-5 sm:p-6`}>
      <PaystackHandoff open={pending} title="Opening Paystack" />
      <p className="text-sm text-deep/75">
        {confirming
          ? "If Paystack already charged you, wait a few seconds."
          : paymentStatus === "FAILED"
            ? "Payment did not go through. Try again."
            : "Pay now to complete this order."}
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (pending) return;
          setPending(true);
          setError("");
          const result = await resumeOrderPayment(token);
          if ("error" in result && result.error) {
            setError(result.error);
            setPending(false);
            return;
          }
          if ("checkoutUrl" in result && result.checkoutUrl) {
            window.location.assign(result.checkoutUrl);
            return;
          }
          setError("Could not open Paystack.");
          setPending(false);
        }}
        className={`mt-4 ${formSubmitInline}`}
      >
        {pending ? "Opening Paystack…" : "Pay now"}
      </button>
    </div>
  );
}
