"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { completeCheckoutReturn, createCheckout } from "@/actions/checkout";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";
import type { CatalogZone } from "@/lib/catalog";
import {
  formButtonSecondary,
  formControl,
  formErrorBox,
  formLabel,
  formSelect,
  formSubmitInline,
  formTextarea,
} from "@/components/ui/form-styles";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutForm({ zones }: { zones: CatalogZone[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = useId();
  const returnHandled = useRef(false);
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [selectedZoneSlug, setSelectedZoneSlug] = useState<string>(
    zones[0]?.slug ?? "maitama",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [returnPending, setReturnPending] = useState(false);

  const handleAutofill = useCallback((data: { name: string; email: string }) => {
    setCustomerName((prev) => prev || data.name);
    setCustomerEmail((prev) => prev || data.email);
  }, []);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => {
      setMounted(true);
    });
    if (useCartStore.persist.hasHydrated()) {
      setMounted(true);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    const orderToken = searchParams.get("order");
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");
    if (!orderToken || !reference || returnHandled.current) return;

    returnHandled.current = true;
    setReturnPending(true);

    void (async () => {
      const result = await completeCheckoutReturn(orderToken, reference);
      setReturnPending(false);

      if ("error" in result && result.error) {
        setError(result.error);
        router.replace("/checkout");
        return;
      }

      if (result.status === "PAID") {
        clear();
        router.replace(`/orders/${orderToken}`);
        return;
      }

      setError("Payment was cancelled. Your bag is still here — try again when ready.");
      router.replace("/checkout");
    })();
  }, [searchParams, router, clear]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedZone = zones.find((z) => z.slug === selectedZoneSlug) ?? zones[0];
  const deliveryFee = fulfillment === "DELIVERY" ? (selectedZone?.fee ?? 0) : 0;
  const grandTotal = subtotal + deliveryFee;

  if (!mounted || returnPending) {
    return (
      <div className="my-12 flex items-center justify-center py-20 text-sm text-deep/50">
        {returnPending ? "Confirming your payment…" : "Loading your bag…"}
      </div>
    );
  }

  if (items.length === 0 && !pending) {
    return (
      <div className="my-10 rounded-3xl border border-deep/10 bg-white p-10 text-center shadow-xs md:p-14">
        <h2 className="font-display text-3xl text-deep md:text-4xl">Your bag is empty</h2>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-deep/70">
          Add a pack first. Drips are booked on their own page.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className={formSubmitInline}
          >
            See the packs
          </Link>
          <Link
            href="/infusions"
            className={formButtonSecondary}
          >
            Book a drip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      id={formId}
      className="grid gap-10 lg:grid-cols-12 lg:items-start"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        setPending(true);

        const result = await createCheckout(
          items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          {
            name: String(form.get("name") ?? "").trim(),
            email: String(form.get("email") ?? "").trim(),
            phone: String(form.get("phone") ?? "").trim(),
            fulfillment,
            zoneSlug: fulfillment === "DELIVERY" ? selectedZoneSlug : undefined,
            addressLine1: fulfillment === "DELIVERY" ? String(form.get("addressLine1") ?? "").trim() : undefined,
            city: fulfillment === "DELIVERY" ? String(form.get("city") ?? "Abuja").trim() : undefined,
            notes: String(form.get("notes") ?? "").trim(),
          },
        );

        setPending(false);

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }

        clear();
        router.push(`/orders/${result.token}`);
      }}
    >
      {/* Left Column: Form Details */}
      <div className="space-y-8 lg:col-span-7">
        {/* Step 1: Customer Info */}
        <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-deep text-xs font-semibold text-cream">
              1
            </span>
            <h2 className="font-display text-xl text-deep">Customer Information</h2>
          </div>
          <p className="mt-1 text-xs text-deep/60">
            We will send your order confirmation and courier dispatch notifications here.
          </p>

          <GuestOrAccountStatus onAutofill={handleAutofill} />

          <div className="mt-6 space-y-4">
            <div>
              <label className={formLabel}>Full Name *</label>
              <input
                name="name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Amina Bello"
                className={formControl}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={formLabel}>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="amina@example.com"
                  className={formControl}
                />
              </div>

              <div>
                <label className={formLabel}>Phone Number *</label>
                <input
                  name="phone"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  className={formControl}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Fulfillment */}
        <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-deep text-xs font-semibold text-cream">
              2
            </span>
            <h2 className="font-display text-xl text-deep">Fulfillment Method</h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFulfillment("DELIVERY")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                fulfillment === "DELIVERY"
                  ? "border-deep bg-deep text-cream shadow-sm"
                  : "border-deep/15 bg-cream/30 text-deep hover:bg-cream"
              }`}
            >
              <span className="text-xs font-medium tracking-wide">Abuja Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => setFulfillment("PICKUP")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                fulfillment === "PICKUP"
                  ? "border-deep bg-deep text-cream shadow-sm"
                  : "border-deep/15 bg-cream/30 text-deep hover:bg-cream"
              }`}
            >
              <span className="text-xs font-medium tracking-wide">Shop pickup</span>
            </button>
          </div>

          {fulfillment === "DELIVERY" ? (
            <div className="mt-6 space-y-4 border-t border-deep/10 pt-6">
              <div>
                <label className={formLabel}>
                  Select Delivery Zone in Abuja *
                </label>
                <select
                  name="zoneSlug"
                  value={selectedZoneSlug}
                  onChange={(e) => setSelectedZoneSlug(e.target.value)}
                  className={formSelect}
                >
                  {zones.map((zone) => (
                    <option key={zone.slug} value={zone.slug}>
                      {zone.name}, {formatNaira(zone.fee)} ({zone.eta})
                    </option>
                  ))}
                </select>
                {selectedZone ? (
                  <p className="mt-1.5 text-[11px] text-sage font-medium">
                    Estimated courier dispatch time: {selectedZone.eta}
                  </p>
                ) : null}
              </div>

              <div>
                <label className={formLabel}>
                  Street Address & Landmark *
                </label>
                <input
                  name="addressLine1"
                  required
                  placeholder="e.g. 14 Danube Street, off IBB Way"
                  className={formControl}
                />
              </div>

              <div>
                <label className={formLabel}>City / District</label>
                <input
                  name="city"
                  defaultValue="Abuja"
                  className={formControl}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-deep/10 bg-cream p-5">
              <div className="text-xs leading-relaxed text-deep/80">
                  <p className="font-semibold text-deep">Pick up at the shop</p>
                  <p className="mt-0.5">{site.address.label}</p>
                  <p className="mt-2 text-deep/70">
                    We’ll pack it and tell you when it’s ready to collect.
                  </p>
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Courier Notes */}
        <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-deep text-xs font-semibold text-cream">
              3
            </span>
            <h2 className="font-display text-xl text-deep">Special Instructions (Optional)</h2>
          </div>
          <p className="mt-1 text-xs text-deep/60">
            Gate code, front desk instructions, or preferred call-upon-arrival notes.
          </p>

          <textarea
            name="notes"
            rows={3}
            placeholder="e.g. Please leave with the security desk or call upon arrival at the gate."
            className={`${formTextarea} mt-4 min-h-0`}
          />
        </section>
      </div>

      {/* Right Column: Order Summary & Payment Button */}
      <div className="lg:sticky lg:top-24 lg:col-span-5">
        <div className="rounded-3xl border border-deep/10 bg-white p-6 shadow-md sm:p-8">
          <h2 className="font-display text-2xl text-deep">Order Summary</h2>

          {/* Itemized lines */}
          <div className="mt-6 divide-y divide-deep/10 overflow-hidden">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3.5 first:pt-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-deep/10 bg-tint/40">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="size-full bg-tint" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-deep">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-deep/60">
                    Qty: {item.quantity} × {formatNaira(item.price)}
                  </p>
                </div>

                <p className="text-xs font-semibold text-deep">
                  {formatNaira(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <dl className="mt-6 space-y-3 border-t border-deep/10 pt-5 text-xs text-deep/70">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-medium text-deep">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                {fulfillment === "DELIVERY"
                  ? `Delivery (${selectedZone?.name ?? "Abuja"})`
                  : "Lounge Pickup"}
              </dt>
              <dd className="font-medium text-deep">
                {deliveryFee === 0 ? "Complimentary" : formatNaira(deliveryFee)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-deep/10 pt-4">
            <div>
              <span className="text-sm font-semibold text-deep">Grand Total</span>
              <p className="text-[10px] text-deep/50">Includes all applicable fees</p>
            </div>
            <span className="font-display text-3xl text-deep">{formatNaira(grandTotal)}</span>
          </div>

          {error ? (
            <p className={`mt-5 ${formErrorBox}`}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || items.length === 0}
            className={`mt-6 flex w-full py-4 ${formSubmitInline}`}
          >
            {pending ? "Processing order" : `Pay ${formatNaira(grandTotal)} via Paystack`}
          </button>

          <p className="mt-5 border-t border-deep/10 pt-4 text-[11px] leading-5 text-deep/60">
            Card, transfer, or USSD. We deliver around Abuja. Packed at the shop.
          </p>
        </div>
      </div>
    </form>
  );
}

function GuestOrAccountStatus({
  onAutofill,
}: {
  onAutofill?: (data: { name: string; email: string }) => void;
}) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-tint/25 px-3.5 py-2.5 text-xs text-deep/80">
        <span className="inline-flex items-center gap-1.5 font-medium text-deep">
          <span className="size-2 rounded-full bg-sage" />
          Guest Checkout Enabled
        </span>
        <span className="text-deep/65">No account required to complete order</span>
      </div>
    );
  }
  return <ClerkAccountStatus onAutofill={onAutofill} />;
}

function ClerkAccountStatus({
  onAutofill,
}: {
  onAutofill?: (data: { name: string; email: string }) => void;
}) {
  const { isSignedIn, user } = useUser();
  const autofilledRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && user && !autofilledRef.current) {
      autofilledRef.current = true;
      onAutofill?.({
        name: user.fullName ?? user.firstName ?? "",
        email: user.primaryEmailAddress?.emailAddress ?? "",
      });
    }
  }, [isSignedIn, user, onAutofill]);

  if (isSignedIn && user) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sage/15 px-3.5 py-2.5 text-xs text-deep">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full bg-sage" />
          Signed in as {user.primaryEmailAddress?.emailAddress}
        </span>
        <span className="text-deep/70">Order will be linked to your account</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-tint/25 px-3.5 py-2.5 text-xs text-deep/80">
      <span className="inline-flex items-center gap-1.5 font-medium text-deep">
        <span className="size-2 rounded-full bg-sage" />
        Guest Checkout Enabled
      </span>
      <span className="text-deep/65">
        No account required. Have an account?{" "}
        <Link href="/login" className="font-medium text-deep underline hover:text-sage">
          Sign in
        </Link>{" "}
        to save orders.
      </span>
    </div>
  );
}
