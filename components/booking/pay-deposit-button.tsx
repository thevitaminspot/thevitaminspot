"use client";

import { useState } from "react";
import { resumeAppointmentDeposit } from "@/actions/booking";
import { nairaLabel } from "@/lib/money";
import { formSubmitInline } from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";

export function PayDepositButton({
  token,
  deposit,
}: {
  token: string;
  deposit: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (deposit <= 0) return null;

  return (
    <div className="mt-6">
      <PaystackHandoff open={pending} title="Opening Paystack" />
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (pending) return;
          setPending(true);
          setError("");
          try {
            const result = await resumeAppointmentDeposit(token);
            if ("error" in result && result.error) {
              setError(result.error);
              setPending(false);
              return;
            }
            if ("checkoutUrl" in result && result.checkoutUrl) {
              window.location.assign(result.checkoutUrl);
              return;
            }
            setError("Could not open Paystack. Please try again.");
            setPending(false);
          } catch {
            setError("Something went wrong. Please try again.");
            setPending(false);
          }
        }}
        className={`${formSubmitInline} w-full sm:w-auto`}
      >
        {pending ? "Opening Paystack…" : `Pay booking fee (${nairaLabel(deposit)})`}
      </button>
      {error ? <p className="mt-2 text-sm text-deep">{error}</p> : null}
    </div>
  );
}
