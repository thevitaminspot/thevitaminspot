"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking, fetchSlots } from "@/actions/booking";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";

type Slot = { start: string; end: string; label: string };

const steps = ["Drip", "Time", "Details", "Confirm"];

export function BookingFlow({
  drips,
  initialSlug,
}: {
  drips: CatalogInfusion[];
  initialSlug?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(initialSlug ?? "");
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

  useEffect(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setMinDate(`${today.getFullYear()}-${month}-${day}`);
  }, []);

  async function choose(nextSlug: string) {
    setSlug(nextSlug);
    setSlot(null);
    setError("");
    if (date) setSlots(await fetchSlots(date, nextSlug));
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

  function next() {
    setError("");
    if (step === 0 && !drip) {
      setError("Pick a drip.");
      return;
    }
    if (step === 1 && !slot) {
      setError("Pick a time.");
      return;
    }
    if (step === 2 && (!details.name || !details.email || !details.phone)) {
      setError("Name, email, and phone are needed.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function confirm(payDeposit: boolean) {
    if (!drip || !slot) return;
    setPending(true);
    setError("");
    const result = await createBooking({
      slug: drip.slug,
      start: slot.start,
      ...details,
      payDeposit,
    });
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("checkoutUrl" in result && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    if ("token" in result && result.token) {
      router.push(`/appointments/${result.token}`);
    }
  }

  return (
    <form
      className="panel mx-auto max-w-xl bg-white p-5 md:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < steps.length - 1) next();
        else void confirm(false);
      }}
    >
      <ol className="flex gap-2 text-[11px] tracking-[0.12em] uppercase">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "text-deep" : "text-deep/35"}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="mt-6 grid gap-2">
          {drips.map((item) => {
            const selected = item.slug === slug;
            return (
              <button
                key={item.id}
                id={item.slug}
                type="button"
                onClick={() => void choose(item.slug)}
                className={`rounded-lg px-4 py-3 text-left ${
                  selected ? "bg-deep text-cream" : "bg-cream text-deep"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-2xl">{item.name}</span>
                  <span className="text-sm">{nairaLabel(item.price)}</span>
                </span>
                <span className={`mt-1 block text-sm ${selected ? "text-cream/75" : "text-deep/65"}`}>
                  {item.tagline}
                </span>
                <span className={`mt-1 block text-xs ${selected ? "text-tint" : "text-deep/50"}`}>
                  {item.durationMin} min · deposit {nairaLabel(item.deposit)}
                </span>
                {selected ? (
                  <span className="mt-3 block space-y-2 text-sm text-cream/80">
                    {item.image ? (
                      <span className="relative block aspect-[8/5] overflow-hidden rounded-lg">
                        <Image src={item.image} alt="" fill className="object-cover" sizes="480px" />
                      </span>
                    ) : null}
                    <span className="block">{item.description}</span>
                    {item.benefits.length > 0 ? (
                      <span className="block">{item.benefits.join(" · ")}</span>
                    ) : null}
                    {item.ingredients.length > 0 ? (
                      <span className="block">In it: {item.ingredients.join(", ")}</span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
          {drips.length === 0 ? <p className="text-sm text-deep/60">No sessions right now.</p> : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6">
          <p className="font-display text-3xl text-deep">{drip?.name}</p>
          <label className="mt-5 block text-sm text-deep">
            Date
            <input
              type="date"
              value={date}
              min={minDate || undefined}
              onChange={(event) => void loadSlots(event.target.value)}
              className="mt-2 w-full rounded-lg border border-deep/15 bg-cream px-4 py-3"
            />
          </label>
          <div className="mt-4">
            <p className="text-sm text-deep">Time</p>
            {!date ? (
              <p className="mt-2 text-sm text-deep/50">Choose a date.</p>
            ) : loadingSlots ? (
              <p className="mt-2 text-sm text-deep/50">Checking that day.</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-deep/60">No times that day.</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {slots.map((item) => (
                  <button
                    key={item.start}
                    type="button"
                    onClick={() => setSlot(item)}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      slot?.start === item.start ? "bg-deep text-cream" : "bg-cream"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-3">
          <input
            required
            placeholder="Name"
            value={details.name}
            onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-lg border border-deep/15 bg-cream px-4 py-3"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={details.email}
            onChange={(event) =>
              setDetails((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-lg border border-deep/15 bg-cream px-4 py-3"
          />
          <input
            required
            placeholder="Phone"
            value={details.phone}
            onChange={(event) =>
              setDetails((current) => ({ ...current, phone: event.target.value }))
            }
            className="w-full rounded-lg border border-deep/15 bg-cream px-4 py-3"
          />
          <textarea
            placeholder="Anything we should know before the drip"
            value={details.notes}
            onChange={(event) =>
              setDetails((current) => ({ ...current, notes: event.target.value }))
            }
            className="min-h-24 w-full rounded-lg border border-deep/15 bg-cream px-4 py-3"
          />
        </div>
      ) : null}

      {step === 3 && drip && slot ? (
        <div className="mt-6 space-y-2 text-sm leading-7 text-deep/80">
          <p className="font-display text-3xl text-deep">{drip.name}</p>
          <p>{drip.tagline}</p>
          <p>
            {slot.label} · {drip.durationMin} min
          </p>
          <p>
            {nairaLabel(drip.price)} · deposit {nairaLabel(drip.deposit)}
          </p>
          <p>
            {details.name}
            <br />
            {details.email}
            <br />
            {details.phone}
          </p>
          {details.notes ? <p>{details.notes}</p> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-deep">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            className="rounded-lg border border-deep/20 px-5 py-3 text-sm"
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
          >
            Back
          </button>
        ) : null}
        {step < steps.length - 1 ? (
          <button type="submit" className="rounded-lg bg-deep px-5 py-3 text-sm text-cream">
            Continue
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-deep/20 px-5 py-3 text-[11px] tracking-[0.16em] uppercase disabled:opacity-40"
            >
              Book
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void confirm(true)}
              className="rounded-lg bg-deep px-5 py-3 text-[11px] tracking-[0.16em] text-cream uppercase disabled:opacity-40"
            >
              Pay deposit
            </button>
          </>
        )}
      </div>
    </form>
  );
}
