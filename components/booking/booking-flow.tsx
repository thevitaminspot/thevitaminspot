"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { createBooking, fetchSlots } from "@/actions/booking";
import { parseBookingDetails } from "@/lib/env";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";
import { useClientDateInputMin } from "@/lib/hooks/use-client-date-input-min";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import {
  formControl,
  formDateControl,
  formError,
  formLabel,
  formSubmit,
  formTextarea,
} from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import {
  BOOKING_CANCELLATION_NOT_FREE,
  BOOKING_FEE_ACK_LABEL,
  BOOKING_FEE_REQUIRED_MESSAGE,
} from "@/lib/booking-policy";

type Slot = { start: string; end: string; label: string };

const stepTitles = [
  "Select a service",
  "Select date & time",
  "Enter your details",
  "Review & confirm",
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-deep/10">
      <div
        className="h-full rounded-full bg-deep transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      />
    </div>
  );
}

function SelectionContext({
  drip,
  slot,
  onChangeService,
}: {
  drip: CatalogInfusion;
  slot?: Slot | null;
  onChangeService?: () => void;
}) {
  return (
    <p className="mb-5 text-sm text-deep/70">
      <span className="font-medium text-deep">{drip.name}</span>
      <span className="text-deep/50"> · </span>
      {drip.durationMin} min · {nairaLabel(drip.price)}
      {slot ? (
        <>
          <span className="text-deep/50"> · </span>
          {slot.label}
        </>
      ) : null}
      {onChangeService ? (
        <>
          <span className="text-deep/50"> · </span>
          <button
            type="button"
            onClick={onChangeService}
            className="font-medium text-deep underline-offset-2 hover:underline"
          >
            Change drip
          </button>
        </>
      ) : null}
    </p>
  );
}

function ServiceDetails({ item }: { item: CatalogInfusion }) {
  return (
    <div className="border-t border-deep/10 px-4 pb-5 pt-3 text-sm leading-relaxed text-deep/70 sm:px-5">
      <p className="text-deep/85">{item.tagline}</p>
      <p className="mt-2">{item.description}</p>
      {item.benefits.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1">
          {item.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      ) : null}
      {item.ingredients.length > 0 ? (
        <p className="mt-3 text-xs text-deep/50">Contains: {item.ingredients.join(", ")}</p>
      ) : null}
    </div>
  );
}

function ServiceList({
  drips,
  slug,
  onChoose,
}: {
  drips: CatalogInfusion[];
  slug: string;
  onChoose: (nextSlug: string) => void;
}) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  function toggleDetails(itemSlug: string) {
    setExpandedSlug((current) => (current === itemSlug ? null : itemSlug));
  }

  return (
    <div>
      <ul className="divide-y divide-deep/12 border-y border-deep/12" role="listbox" aria-label="Services">
        {drips.map((item) => {
          const active = item.slug === slug;
          const expanded = expandedSlug === item.slug;
          return (
            <li key={item.id} className={active ? "bg-tint/40" : undefined}>
              <div className="flex items-stretch">
                <button
                  type="button"
                  id={item.slug}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChoose(item.slug);
                    setExpandedSlug(item.slug);
                  }}
                  className={`min-w-0 flex-1 py-4 pl-4 text-left transition sm:pl-5 ${
                    active ? "" : "hover:bg-deep/[0.04]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-5 pr-4 sm:pr-5">
                    <span className="min-w-0">
                      <span className={`font-display text-xl ${active ? "text-deep" : "text-deep/85"}`}>
                        {item.name}
                      </span>
                      <span className="mt-1 block text-xs text-deep/50">
                        {item.durationMin} min · booking fee {nairaLabel(item.deposit)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-medium tabular-nums text-deep/85">
                      {nairaLabel(item.price)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleDetails(item.slug)}
                  className="flex w-11 shrink-0 items-center justify-center border-l border-deep/10 text-deep/50 transition hover:bg-deep/[0.04] hover:text-deep sm:w-12"
                  aria-expanded={expanded}
                  aria-label={expanded ? `Hide ${item.name} details` : `Show ${item.name} details`}
                >
                  <ChevronDown className={`size-5 transition ${expanded ? "rotate-180" : ""}`} />
                </button>
              </div>
              {expanded ? <ServiceDetails item={item} /> : null}
            </li>
          );
        })}
      </ul>
      {!slug ? (
        <p className="mt-4 px-4 text-sm text-deep/50 sm:px-5">Select a session, then continue.</p>
      ) : null}
    </div>
  );
}

export function BookingFlow({
  drips,
  initialSlug,
}: {
  drips: CatalogInfusion[];
  initialSlug?: string;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [date, setDate] = useState("");
  const minDate = useClientDateInputMin();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const drip = useMemo(() => drips.find((item) => item.slug === slug), [drips, slug]);
  const formTopRef = useRef<HTMLDivElement>(null);
  const skipStepScrollRef = useRef(true);

  function scrollToFormTop() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (skipStepScrollRef.current) {
      skipStepScrollRef.current = false;
      return;
    }
    scrollToFormTop();
  }, [step]);

  async function choose(nextSlug: string) {
    setSlug(nextSlug);
    setSlot(null);
    setError("");
    if (date) setSlots(await fetchSlots(date, nextSlug));
    scrollToFormTop();
  }

  async function loadSlots(nextDate: string) {
    setDate(nextDate);
    setSlot(null);
    if (!slug) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSlots(await fetchSlots(nextDate, slug));
    setLoadingSlots(false);
  }

  function back() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  function next() {
    setError("");
    if (step === 0 && !drip) {
      setError("Select a service to continue.");
      return;
    }
    if (step === 1 && !slot) {
      setError("Select a time to continue.");
      return;
    }
    if (step === 1) {
      setDetails((current) => {
        if (!isLoaded || !isSignedIn || !user) return current;
        return {
          name: current.name || user.fullName || user.firstName || "",
          email: current.email || user.primaryEmailAddress?.emailAddress || "",
          phone: current.phone,
          notes: current.notes,
        };
      });
    }
    if (step === 2) {
      const parsed = parseBookingDetails(details);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
    }
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  async function confirm() {
    if (!drip || !slot) return;
    if (!policyAcknowledged) {
      setError("Please confirm you understand the booking fee and cancellation policy.");
      return;
    }
    const parsed = parseBookingDetails(details);
    if (!parsed.ok) {
      setError(parsed.error);
      setStep(2);
      return;
    }
    if (drip.deposit <= 0) {
      setError("This session is not available for online booking. Please contact us.");
      return;
    }
    setPending(true);
    setPaying(true);
    setError("");
    try {
      const result = await createBooking({
        slug: drip.slug,
        start: slot.start,
        ...parsed.data,
        payDeposit: true,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        setPending(false);
        setPaying(false);
        return;
      }
      if ("checkoutUrl" in result && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setError("Could not open Paystack. Please try again.");
      setPending(false);
      setPaying(false);
    } catch {
      setError("Something went wrong while booking. Please try again.");
      setPending(false);
      setPaying(false);
    }
  }

  return (
    <div ref={formTopRef} className="mx-auto w-full min-w-0 scroll-mt-24">
      <PaystackHandoff
        open={pending}
        title={paying ? "Taking you to Paystack" : "Saving your booking"}
        detail="Stay on this page."
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step < stepTitles.length - 1) next();
          else void confirm();
        }}
        className="min-w-0"
      >
        <header className="mb-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-deep/70 hover:text-deep"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </button>
          ) : null}
          <ProgressBar step={step} total={stepTitles.length} />
          <h2 className="mt-4 font-display text-2xl text-deep">{stepTitles[step]}</h2>
        </header>

        <div className="min-w-0">
          {step === 0 ? (
            drips.length === 0 ? (
              <p className="text-sm text-deep/60">No sessions available right now.</p>
            ) : (
              <ServiceList drips={drips} slug={slug} onChoose={(next) => void choose(next)} />
            )
          ) : null}

          {step === 1 && drip ? (
            <>
              <SelectionContext drip={drip} onChangeService={() => setStep(0)} />
              <label className={`${formLabel} block min-w-0`}>
                Date
                <input
                  type="date"
                  value={date}
                  min={minDate || undefined}
                  onChange={(event) => void loadSlots(event.target.value)}
                  className={formDateControl}
                />
              </label>
              <div className="mt-5">
                <p className={formLabel}>Time</p>
                {!date ? (
                  <p className="mt-2 text-sm text-deep/50">Select a date to see available times.</p>
                ) : loadingSlots ? (
                  <p className="mt-2 text-sm text-deep/50">Loading times…</p>
                ) : slots.length === 0 ? (
                  <p className="mt-2 text-sm text-deep/60">No availability. Try another date.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {slots.map((item) => (
                      <button
                        key={item.start}
                        type="button"
                        onClick={() => {
                          setSlot(item);
                          scrollToFormTop();
                        }}
                        className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          slot?.start === item.start
                            ? "bg-deep text-cream"
                            : "bg-deep/[0.06] text-deep hover:bg-deep/10"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {step === 2 && drip ? (
            <>
              <SelectionContext drip={drip} slot={slot} onChangeService={() => setStep(0)} />
              <GuestBookingNote />
              <div className="mt-4 space-y-4">
                <label className={formLabel}>
                  Full name
                  <input
                    required
                    minLength={2}
                    autoComplete="name"
                    value={details.name}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, name: event.target.value }))
                    }
                    className={formControl}
                  />
                </label>
                <label className={formLabel}>
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={details.email}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, email: event.target.value }))
                    }
                    className={formControl}
                  />
                </label>
                <label className={formLabel}>
                  Phone
                  <input
                    required
                    type="tel"
                    minLength={10}
                    autoComplete="tel"
                    inputMode="tel"
                    value={details.phone}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, phone: event.target.value }))
                    }
                    className={formControl}
                  />
                </label>
                <label className={formLabel}>
                  Additional notes <span className="font-normal text-deep/40">optional</span>
                  <textarea
                    value={details.notes}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, notes: event.target.value }))
                    }
                    className={`${formTextarea} min-h-20`}
                    placeholder="Medical history, allergies, pregnancy…"
                  />
                </label>
              </div>
            </>
          ) : null}

          {step === 3 && drip && slot ? (
            <dl className="divide-y divide-deep/10 text-sm">
              <div className="flex justify-between gap-4 py-3 first:pt-0">
                <dt className="text-deep/55">Service</dt>
                <dd className="text-right font-medium text-deep">{drip.name}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Date & time</dt>
                <dd className="text-right font-medium text-deep">{slot.label}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Duration</dt>
                <dd className="font-medium text-deep">{drip.durationMin} minutes</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Price</dt>
                <dd className="font-medium text-deep">{nairaLabel(drip.price)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Booking fee</dt>
                <dd className="font-medium text-deep">{nairaLabel(drip.deposit)}</dd>
              </div>
              <div className="py-3 text-sm leading-relaxed text-deep/65">
                <p>{BOOKING_FEE_REQUIRED_MESSAGE}</p>
                <p className="mt-2">{BOOKING_CANCELLATION_NOT_FREE}</p>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Name</dt>
                <dd className="text-right font-medium text-deep">{details.name}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Email</dt>
                <dd className="text-right font-medium text-deep">{details.email}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-deep/55">Phone</dt>
                <dd className="font-medium text-deep">{details.phone}</dd>
              </div>
              {details.notes ? (
                <div className="py-3">
                  <dt className="text-deep/55">Notes</dt>
                  <dd className="mt-1 text-deep/80">{details.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {error ? (
            <p role="alert" className={`mt-4 ${formError}`}>
              {error}
            </p>
          ) : null}
        </div>

        <footer className="mt-8 space-y-2">
          {step < stepTitles.length - 1 ? (
            <button
              type="submit"
              disabled={step === 0 && !drip}
              className={formSubmit}
            >
              Continue
            </button>
          ) : (
            <>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-deep/10 bg-cream/20 px-4 py-3 text-sm text-deep/75">
                <input
                  type="checkbox"
                  checked={policyAcknowledged}
                  onChange={(event) => setPolicyAcknowledged(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{BOOKING_FEE_ACK_LABEL}</span>
              </label>
              <button
                type="submit"
                disabled={pending || !policyAcknowledged || drip.deposit <= 0}
                className={formSubmit}
              >
                {pending ? "Opening Paystack…" : `Pay booking fee (${nairaLabel(drip.deposit)})`}
              </button>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}

function GuestBookingNote() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <GuestBookingCopy />;
  }
  return <ClerkBookingNote />;
}

function ClerkBookingNote() {
  const mounted = useClientMounted();
  const { isLoaded, isSignedIn } = useUser();
  if (!mounted) return <GuestBookingCopy />;
  if (!isLoaded || isSignedIn) return null;
  return <GuestBookingCopy />;
}

function GuestBookingCopy() {
  return (
    <p className="text-xs text-deep/60">
      No account required.{" "}
      <Link href="/login" className="font-medium text-deep underline-offset-2 hover:underline">
        Sign in
      </Link>{" "}
      to save your bookings.
    </p>
  );
}
