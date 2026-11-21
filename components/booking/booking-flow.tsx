"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import { createBooking, fetchSlots, resumeAppointmentDeposit } from "@/actions/booking";
import { parseBookingDetails } from "@/lib/env";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";
import { useClientDateInputMin } from "@/lib/hooks/use-client-date-input-min";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import {
  formControl,
  formDateControl,
  formLabel,
  formSubmit,
  formTextarea,
} from "@/components/ui/form-styles";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import { PaystackButtonContent, usePaystackCheckout } from "@/components/ui/use-paystack-checkout";
import {
  BOOKING_CANCELLATION_NOT_FREE,
  BOOKING_FEE_ACK_LABEL,
  BOOKING_FEE_REQUIRED_MESSAGE,
} from "@/lib/booking-policy";
import { surfaceCard } from "@/components/ui/layout-styles";
import { notifyError } from "@/lib/notify";

type Slot = { start: string; end: string; label: string };

function readBookingToken(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeBookingToken(key: string, token: string) {
  try {
    sessionStorage.setItem(key, token);
  } catch {
    /* private mode */
  }
}

function clearBookingToken(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

const stepTitles = [
  "Choose a drip",
  "Date & time",
  "Your details",
  "Review & pay",
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

function DripDetails({ item }: { item: CatalogInfusion }) {
  return (
    <div className="text-sm leading-relaxed text-deep/70">
      <p>{item.description}</p>
      {item.benefits.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-deep/75">
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
  return (
    <div className={surfaceCard}>
      <p className="text-sm leading-relaxed text-deep/60">
        Select a drip below. Session price and booking fee are shown for each option.
      </p>
      <ul className="mt-5 space-y-3" role="listbox" aria-label="IV drips">
        {drips.map((item) => {
          const active = item.slug === slug;
          return (
            <li key={item.id}>
              <button
                type="button"
                id={item.slug}
                role="option"
                aria-selected={active}
                onClick={() => onChoose(item.slug)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-deep/25 bg-tint/45 shadow-sm ring-1 ring-deep/10"
                    : "border-deep/10 bg-cream/15 hover:border-deep/20 hover:bg-cream/35"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition ${
                      active ? "border-deep bg-deep" : "border-deep/25 bg-white"
                    }`}
                    aria-hidden
                  >
                    {active ? <span className="size-1.5 rounded-full bg-cream" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={`font-display text-xl ${active ? "text-deep" : "text-deep/88"}`}>
                        {item.name}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-deep/85">
                        {nairaLabel(item.price)}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-deep/50">
                      {item.durationMin} min · booking fee {nairaLabel(item.deposit)}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-deep/65">{item.tagline}</span>
                  </span>
                </div>
              </button>
              {active ? (
                <div className="mt-2 rounded-xl border border-deep/10 bg-cream/30 px-4 py-4 sm:px-5">
                  <DripDetails item={item} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!slug ? (
        <p className="mt-5 text-center text-sm text-deep/50">Choose a drip, then tap Continue.</p>
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
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const paystack = usePaystackCheckout();
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
    setStep((current) => Math.max(0, current - 1));
  }

  function next() {
    if (step === 0 && !drip) {
      notifyError("Choose a drip to continue.");
      return;
    }
    if (step === 1 && !slot) {
      notifyError("Select a time to continue.");
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
        notifyError(parsed.error);
        return;
      }
    }
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  async function confirm() {
    if (!drip || !slot) return;
    if (!policyAcknowledged) {
      notifyError("Please confirm you understand the booking fee and cancellation policy.");
      return;
    }
    const parsed = parseBookingDetails(details);
    if (!parsed.ok) {
      notifyError(parsed.error);
      setStep(2);
      return;
    }
    if (drip.deposit <= 0) {
      notifyError("This session is not available for online booking. Please contact us.");
      return;
    }
    if (paystack.busy) return;
    const storageKey = `tvs-booking:${drip.slug}:${slot.start}`;
    const savedToken = readBookingToken(storageKey);
    const book = () =>
      createBooking({
        slug: drip.slug,
        start: slot.start,
        ...parsed.data,
        payDeposit: true,
      });
    let result = await paystack.start(
      () => (savedToken ? resumeAppointmentDeposit(savedToken) : book()),
      {
        cancel: "stay",
        cancelMessage: "Payment cancelled. Your booking details are still here when you’re ready.",
      },
    );
    if (result?.error && savedToken && /not found|cancelled|already taken place/i.test(result.error)) {
      clearBookingToken(storageKey);
      result = await paystack.start(book, {
        cancel: "stay",
        cancelMessage: "Payment cancelled. Your booking details are still here when you’re ready.",
      });
    }
    if (result?.token) writeBookingToken(storageKey, result.token);
  }

  return (
    <div ref={formTopRef} className="mx-auto w-full min-w-0 scroll-mt-24">
      <PaystackHandoff
        open={paystack.overlay !== null}
        title={paystack.overlay?.title}
        detail={paystack.overlay?.detail}
        onForceClose={paystack.reset}
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
          ) : drip && slot ? (
            <>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-deep/10 bg-cream/20 px-4 py-3 text-sm text-deep/75">
                <input
                  type="checkbox"
                  checked={policyAcknowledged}
                  onChange={(event) => setPolicyAcknowledged(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {BOOKING_FEE_ACK_LABEL}{" "}
                  <Link
                    href="/refunds#booking"
                    className="text-deep underline decoration-deep/25 underline-offset-2"
                  >
                    Read the booking fee policy
                  </Link>
                  .
                </span>
              </label>
              <button
                type="submit"
                disabled={paystack.busy || !policyAcknowledged || drip.deposit <= 0}
                className={formSubmit}
              >
                <PaystackButtonContent
                  phase={paystack.phase}
                  idle={`Pay booking fee (${nairaLabel(drip.deposit)})`}
                />
              </button>
            </>
          ) : null}
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
