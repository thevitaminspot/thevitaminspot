"use client";

import { useState } from "react";
import { resumeAppointmentDeposit } from "@/actions/booking";
import { nairaLabel } from "@/lib/money";

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
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await resumeAppointmentDeposit(token);
            if ("error" in result && result.error) {
              setError(result.error);
              return;
            }
            if ("checkoutUrl" in result && result.checkoutUrl) {
              window.location.href = result.checkoutUrl;
              return;
            }
            setError("Could not open Paystack. Please try again.");
          } catch {
            setError("Something went wrong. Please try again.");
          } finally {
            setPending(false);
          }
        }}
        className="inline-flex w-full items-center justify-center rounded-xl bg-deep px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a] disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Opening Paystack…" : `Pay deposit (${nairaLabel(deposit)})`}
      </button>
      {error ? <p className="mt-2 text-sm text-deep">{error}</p> : null}
    </div>
  );
}
