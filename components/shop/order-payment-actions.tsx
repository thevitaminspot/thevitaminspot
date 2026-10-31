"use client";

import { resumeOrderPayment } from "@/actions/checkout";
import { formSubmitInline } from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import { PaystackButtonContent, usePaystackCheckout } from "@/components/ui/use-paystack-checkout";
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
  const paystack = usePaystackCheckout();

  if (orderStatus === "PAID" || paymentStatus === "PAID") return null;
  if (["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) return null;
  if (orderStatus === "CANCELLED") return null;

  return (
    <div className={`${surfaceMuted} mt-8 p-5 sm:p-6`}>
      <PaystackHandoff
        open={paystack.overlay !== null}
        title={paystack.overlay?.title}
        detail={paystack.overlay?.detail}
        onForceClose={paystack.reset}
      />
      <p className="text-sm text-deep/75">
        {confirming
          ? "If Paystack already charged you, this page will update on its own."
          : paymentStatus === "FAILED"
            ? "Payment did not go through. Try again."
            : "Pay now to complete this order. Checkout stays on this page."}
      </p>
      <button
        type="button"
        disabled={paystack.busy || confirming}
        aria-busy={paystack.busy || confirming}
        onClick={() => {
          if (confirming) return;
          void paystack.start(() => resumeOrderPayment(token), { cancel: "stay" });
        }}
        className={`mt-4 ${formSubmitInline}`}
      >
        <PaystackButtonContent phase={paystack.phase} idle="Pay now" />
      </button>
    </div>
  );
}
