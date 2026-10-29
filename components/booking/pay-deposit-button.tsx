"use client";

import { resumeAppointmentDeposit } from "@/actions/booking";
import { nairaLabel } from "@/lib/money";
import { formSubmitInline } from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import { PaystackButtonContent, usePaystackCheckout } from "@/components/ui/use-paystack-checkout";

export function PayDepositButton({
  token,
  deposit,
  disabled = false,
}: {
  token: string;
  deposit: number;
  disabled?: boolean;
}) {
  const paystack = usePaystackCheckout();

  if (deposit <= 0) return null;

  return (
    <div className="mt-6">
      <PaystackHandoff
        open={paystack.overlay !== null}
        title={paystack.overlay?.title}
        detail={paystack.overlay?.detail}
      />
      <button
        type="button"
        disabled={paystack.busy || disabled}
        aria-busy={paystack.busy || disabled}
        onClick={() => {
          if (disabled) return;
          void paystack.start(() => resumeAppointmentDeposit(token), { cancel: "stay" });
        }}
        className={`${formSubmitInline} w-full sm:w-auto`}
      >
        <PaystackButtonContent
          phase={paystack.phase}
          idle={`Pay booking fee (${nairaLabel(deposit)})`}
        />
      </button>
      {paystack.error ? <p className="mt-2 text-sm text-deep">{paystack.error}</p> : null}
    </div>
  );
}
