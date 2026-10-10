"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelAppointment, fetchSlots, updateAppointment } from "@/actions/booking";
import { formatLagosLong } from "@/lib/datetime";
import { useClientDateInputMin } from "@/lib/hooks/use-client-date-input-min";
import { BOOKING_CANCEL_REASONS } from "@/lib/booking-cancel";
import { formatNaira } from "@/lib/money";
import {
  formButtonGhost,
  formButtonSecondary,
  formDateControl,
  formErrorBox,
  formLabel,
  formSubmitInline,
  formTextarea,
} from "@/components/ui/form-styles";
import { surfaceCard, surfaceMuted } from "@/components/ui/layout-styles";

function formatWhen(date: Date) {
  return formatLagosLong(date);
}

export function AppointmentManager({
  token,
  slug,
  serviceName,
  startsAt,
  status,
  deposit,
  depositPaid,
}: {
  token: string;
  slug: string;
  serviceName: string;
  startsAt: Date;
  status: string;
  deposit?: number;
  depositPaid?: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const minDate = useClientDateInputMin();
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [reschedulePending, setReschedulePending] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "review" | "form">("idle");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelPending, setCancelPending] = useState(false);

  const when = formatWhen(startsAt);
  const hasDeposit = Boolean(deposit && deposit > 0);
  const paidDeposit = Boolean(depositPaid && hasDeposit);

  async function rescheduleToFirstSlot() {
    setReschedulePending(true);
    setRescheduleMessage("");
    try {
      const slots = await fetchSlots(date, slug);
      const first = slots[0];
      if (!first) {
        setRescheduleMessage("No chairs open that day. Try another date.");
        return;
      }
      const result = await updateAppointment(token, first.start);
      if ("error" in result && result.error) {
        setRescheduleMessage(result.error);
        return;
      }
      setRescheduleMessage(`Moved to ${first.label}. We emailed you an updated booking email.`);
      router.refresh();
    } finally {
      setReschedulePending(false);
    }
  }

  async function submitCancellation() {
    setCancelError("");
    setCancelPending(true);
    try {
      const result = await cancelAppointment(token, {
        reason,
        details: details.trim() || undefined,
        acknowledged,
      });
      if ("error" in result && result.error) {
        setCancelError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setCancelError("Something went wrong. Please try again or WhatsApp us.");
    } finally {
      setCancelPending(false);
    }
  }

  if (status === "CANCELLED") {
    return (
      <section className={`mt-8 ${surfaceMuted} p-5 sm:p-6`}>
        <p className="text-[11px] tracking-[0.18em] text-deep/50 uppercase">Cancelled</p>
        <p className="mt-2 text-sm leading-7 text-deep/70">
          This session was cancelled. Your slot has been released. Book again anytime if your plans
          change.
        </p>
        <a
          href="/book"
          className={`${formButtonSecondary} mt-5 inline-flex`}
        >
          Book a new session
        </a>
      </section>
    );
  }

  if (status === "COMPLETED") {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <section className={surfaceCard}>
        <p className="text-[11px] tracking-[0.18em] text-sage uppercase">Reschedule</p>
        <p className="mt-2 text-sm leading-7 text-deep/65">
          Pick a new date and we&apos;ll move you to the first open chair that day. You&apos;ll get
          a fresh confirmation email.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <label className={`${formLabel} block min-w-0`}>
            New date
            <input
              type="date"
              value={date}
              min={minDate || undefined}
              onChange={(event) => setDate(event.target.value)}
              className={formDateControl}
            />
          </label>
          <button
            type="button"
            disabled={!date || reschedulePending}
            onClick={() => void rescheduleToFirstSlot()}
            className={formSubmitInline}
          >
            {reschedulePending ? "Updating…" : "Move to first open hour"}
          </button>
        </div>
        {rescheduleMessage ? (
          <p className="mt-3 text-sm text-deep/70">{rescheduleMessage}</p>
        ) : null}
      </section>

      <section className={surfaceCard}>
        <p className="text-[11px] tracking-[0.18em] text-deep/45 uppercase">Cancel booking</p>

        {cancelStep === "idle" ? (
          <>
            <p className="mt-2 text-sm leading-7 text-deep/65">
              Need to let your slot go? We&apos;ll ask you to confirm — cancellations are recorded
              and your confirmation email will be updated.
            </p>
            <button
              type="button"
              onClick={() => {
                setCancelStep("review");
                setCancelError("");
              }}
              className={`${formButtonGhost} mt-4 border-red-200/80 text-red-800 hover:bg-red-50`}
            >
              Start cancellation
            </button>
          </>
        ) : null}

        {cancelStep === "review" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-deep/10 bg-cream/25 p-4">
              <p className="text-xs font-medium tracking-[0.12em] text-deep/50 uppercase">
                You are about to cancel
              </p>
              <p className="mt-2 font-medium text-deep">{serviceName}</p>
              <p className="mt-1 text-sm text-deep/70">{when}</p>
              {paidDeposit && deposit ? (
                <p className="mt-3 text-sm text-deep/65">
                  Deposit paid: <strong>{formatNaira(deposit)}</strong>. Refunds are reviewed case
                  by case — contact us after cancelling if you need help.
                </p>
              ) : hasDeposit ? (
                <p className="mt-3 text-sm text-deep/65">
                  No deposit was paid for this booking. Your slot will simply be released.
                </p>
              ) : (
                <p className="mt-3 text-sm text-deep/65">
                  No deposit required. Your slot will be released for other guests.
                </p>
              )}
            </div>
            <ul className="space-y-2 text-sm text-deep/70">
              <li>• This cannot be undone online — you&apos;ll need to book again for a new time.</li>
              <li>• We&apos;ll email you a cancellation confirmation.</li>
              <li>• Our team will be notified immediately.</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCancelStep("form")}
                className="rounded-xl bg-red-800 px-5 py-3 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-red-900"
              >
                Continue to cancel
              </button>
              <button
                type="button"
                onClick={() => setCancelStep("idle")}
                className={formButtonSecondary}
              >
                Keep my booking
              </button>
            </div>
          </div>
        ) : null}

        {cancelStep === "form" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-deep/65">
              Help us understand why you&apos;re cancelling. This is shared with our team.
            </p>

            <fieldset className="space-y-2">
              <legend className={formLabel}>Reason</legend>
              {BOOKING_CANCEL_REASONS.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    reason === item.value
                      ? "border-deep/30 bg-cream/40 text-deep"
                      : "border-deep/10 text-deep/75 hover:border-deep/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="mt-0.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>

            <label className={`${formLabel} block`}>
              {reason === "other" ? "Please tell us more" : "Anything else we should know? (optional)"}
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
                maxLength={500}
                className={formTextarea}
                placeholder={
                  reason === "other"
                    ? "A sentence or two helps us improve."
                    : "Optional — allergies, timing, or special circumstances."
                }
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-deep/10 bg-cream/20 px-4 py-3 text-sm text-deep/75">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                I understand this will cancel my session, release my time slot, and send me a
                confirmation email.{" "}
                {paidDeposit
                  ? "I understand deposit refunds are not automatic."
                  : null}
              </span>
            </label>

            {cancelError ? <p className={formErrorBox}>{cancelError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={cancelPending || !reason || !acknowledged}
                onClick={() => void submitCancellation()}
                className="rounded-xl bg-red-800 px-5 py-3 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelPending ? "Cancelling…" : "Confirm cancellation"}
              </button>
              <button
                type="button"
                disabled={cancelPending}
                onClick={() => {
                  setCancelStep("review");
                  setCancelError("");
                }}
                className={formButtonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                disabled={cancelPending}
                onClick={() => {
                  setCancelStep("idle");
                  setReason("");
                  setDetails("");
                  setAcknowledged(false);
                  setCancelError("");
                }}
                className={formButtonGhost}
              >
                Keep my booking
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
