"use client";

import Link from "next/link";
import { useState } from "react";
import { resumeOrderPayment } from "@/actions/checkout";
import { formButtonSecondary, formSubmitInline } from "@/components/ui/form-styles";

export function OrderPaymentActions({
  token,
  paymentStatus,
  orderStatus,
}: {
  token: string;
  paymentStatus?: string | null;
  orderStatus: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (orderStatus === "PAID" || paymentStatus === "PAID") return null;

  return (
    <div className="mt-8 rounded-2xl border border-deep/10 bg-cream/40 p-5">
      <p className="text-sm text-deep/75">
        {paymentStatus === "FAILED"
          ? "Payment was cancelled or did not go through."
          : "This order is waiting for payment."}
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError("");
            const result = await resumeOrderPayment(token);
            setPending(false);
            if ("error" in result && result.error) {
              setError(result.error);
              return;
            }
            if ("checkoutUrl" in result && result.checkoutUrl) {
              window.location.href = result.checkoutUrl;
            }
          }}
          className={formSubmitInline}
        >
          {pending ? "Opening Paystack…" : "Pay now"}
        </button>
        <Link href="/checkout" className={formButtonSecondary}>
          Back to checkout
        </Link>
      </div>
    </div>
  );
}
