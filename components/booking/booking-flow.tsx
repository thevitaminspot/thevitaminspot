"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { createBooking, fetchSlots } from "@/actions/booking";
import { parseBookingDetails } from "@/lib/env";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";
import {
  formControl,
  formError,
  formLabel,
  formSubmit,
  formTextarea,
} from "@/components/ui/form-styles";

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
    <div className="mb-6 rounded-lg border border-deep/10 bg-cream/40 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-deep">{drip.name}</p>
          <p className="mt-0.5 text-deep/55">
            {drip.durationMin} min · {nairaLabel(drip.price)}
            {slot ? ` · ${slot.label}` : ""}
          </p>
        </div>
        {onChangeService ? (
          <button
            type="button"
            onClick={onChangeService}
            className="shrink-0 text-xs font-medium text-deep underline-offset-2 hover:underline"
          >
            Change
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ServiceRow({
  item,
  selected,
  expanded,
  onSelect,
  onToggleDetails,
}: {
  item: CatalogInfusion;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleDetails: () => void;
}) {
  return (
    <div
      className={`rounded-lg border transition ${
        selected ? "border-deep bg-deep/[0.03]" : "border-deep/10 hover:border-deep/25"
      }`}
    >
      <button
        type="button"
        id={item.slug}
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-deep" : "border-deep/25"
          }`}
          aria-hidden
        >
          {selected ? <span className="size-2 rounded-full bg-deep" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-deep">{item.name}</span>
          <span className="mt-0.5 block text-xs text-deep/55">
            {item.durationMin} min · deposit {nairaLabel(item.deposit)}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-deep">{nairaLabel(item.price)}</span>
      </button>

      <div className="border-t border-deep/10 px-4 py-2">
        <button
          type="button"
          onClick={onToggleDetails}
          className="flex w-full items-center justify-between py-1 text-xs font-medium text-deep/60 hover:text-deep"
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "View details"}
          <ChevronDown className={`size-4 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded ? (
          <div className="pb-3 pt-1 text-sm leading-relaxed text-deep/70">
            <p>{item.description}</p>
            {item.benefits.length > 0 ? (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-deep/65">
                {item.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            ) : null}
            {item.ingredients.length > 0 ? (
              <p className="mt-2 text-xs text-deep/50">Contains: {item.ingredients.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
      </div>
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
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
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
  const drip = useMemo(() => drips.find((item) => item.slug === slug), [drips, slug]);
  const formTopRef = useRef<HTMLDivElement>(null);
  const skipStepScrollRef = useRef(true);

  function scrollToFormTop() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setMinDate(`${today.getFullYear()}-${month}-${day}`);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    setDetails((current) => ({
      name: current.name || user.fullName || user.firstName || "",
      email: current.email || user.primaryEmailAddress?.emailAddress || "",
      phone: current.phone,
      notes: current.notes,
    }));
  }, [isLoaded, isSignedIn, user]);

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
    if (step === 2) {
      const parsed = parseBookingDetails(details);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
    }
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  async function confirm(payDeposit: boolean) {
    if (!drip || !slot) return;
    const parsed = parseBookingDetails(details);
    if (!parsed.ok) {
      setError(parsed.error);
      setStep(2);
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await createBooking({
        slug: drip.slug,
        start: slot.start,
        ...parsed.data,
        payDeposit,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("checkoutUrl" in result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (payDeposit) {
        setError("Could not open Paystack. Try again or book without a deposit.");
        return;
      }
      if ("token" in result && result.token) {
        router.push(`/appointments/${result.token}`);
      }
    } catch {
      setError("Something went wrong while booking. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const canPayDeposit = Boolean(drip && drip.deposit > 0);

  return (
    <div ref={formTopRef} className="mx-auto w-full max-w-md scroll-mt-24">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step < stepTitles.length - 1) next();
          else void confirm(false);
        }}
        className="overflow-hidden rounded-xl border border-deep/10 bg-white shadow-sm"
      >
        <header className="border-b border-deep/10 px-5 py-4 sm:px-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-deep/70 hover:text-deep"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </button>
          ) : null}
          <ProgressBar step={step} total={stepTitles.length} />
          <p className="mt-3 text-xs text-deep/50">
            Step {step + 1} of {stepTitles.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-deep">{stepTitles[step]}</h2>
        </header>

        <div className="px-5 py-6 sm:px-6">
          {step === 0 ? (
            drips.length === 0 ? (
              <p className="text-sm text-deep/60">No sessions available right now.</p>
            ) : (
              <ul className="space-y-2" role="listbox" aria-label="Services">
                {drips.map((item) => (
                  <li key={item.id}>
                    <ServiceRow
                      item={item}
                      selected={item.slug === slug}
                      expanded={expandedSlug === item.slug}
                      onSelect={() => void choose(item.slug)}
                      onToggleDetails={() =>
                        setExpandedSlug((current) => (current === item.slug ? null : item.slug))
                      }
                    />
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {step === 1 && drip ? (
            <>
              <SelectionContext drip={drip} onChangeService={() => setStep(0)} />
              <label className={formLabel}>
                Date
                <input
                  type="date"
                  value={date}
                  min={minDate || undefined}
                  onChange={(event) => void loadSlots(event.target.value)}
                  className={formControl}
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
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                          slot?.start === item.start
                            ? "border-deep bg-deep text-cream"
                            : "border-deep/15 text-deep hover:border-deep/30"
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
                <dt className="text-deep/55">Deposit</dt>
                <dd className="font-medium text-deep">{nairaLabel(drip.deposit)}</dd>
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

        <footer className="border-t border-deep/10 bg-cream/20 px-5 py-4 sm:px-6">
          {step < stepTitles.length - 1 ? (
            <button
              type="submit"
              disabled={step === 0 && !drip}
              className={formSubmit}
            >
              Continue
            </button>
          ) : (
            <div className="space-y-2">
              <button type="submit" disabled={pending} className={formSubmit}>
                {pending ? "Booking…" : "Confirm booking"}
              </button>
              {canPayDeposit ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void confirm(true)}
                  className="flex w-full items-center justify-center rounded-xl border border-deep/15 bg-white py-3.5 text-sm font-medium text-deep transition hover:bg-cream/50 disabled:opacity-50"
                >
                  {pending ? "Opening Paystack…" : `Pay deposit (${nairaLabel(drip!.deposit)})`}
                </button>
              ) : null}
            </div>
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
  const { isLoaded, isSignedIn } = useUser();
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
