"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createCheckout, resumeOrderPayment } from "@/actions/checkout";
import {
  checkoutFingerprint,
  clearSavedCheckout,
  readSavedCheckout,
  saveCheckout,
} from "@/lib/checkout-session";
import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";
import type { CatalogZone } from "@/lib/catalog";
import {
  formButtonSecondary,
  formControl,
  formLabel,
  formSubmit,
  formSubmitInline,
  formTextarea,
} from "@/components/ui/form-styles";
import { DeliveryAreaPicker } from "@/components/shop/delivery-area-picker";
import { PaystackHandoff } from "@/components/ui/paystack-handoff";
import { PaystackButtonContent, usePaystackCheckout } from "@/components/ui/use-paystack-checkout";
import { surfaceCard } from "@/components/ui/layout-styles";
import {
  type DeliveryRegion,
  deliveryRegionForSlug,
  isAbujaAreaZone,
  zoneSlugForRegion,
} from "@/lib/delivery-regions";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutForm({ zones }: { zones: CatalogZone[] }) {
  const router = useRouter();
  const formId = useId();
  const cartHydrated = useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const updatePrices = useCartStore((state) => state.updatePrices);

  const defaultAbujaSlug =
    zones.find((zone) => zone.slug === "cbd")?.slug ??
    zones.find((zone) => isAbujaAreaZone(zone.slug))?.slug ??
    "cbd";

  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [region, setRegion] = useState<DeliveryRegion>("abuja");
  const [abujaSlug, setAbujaSlug] = useState(defaultAbujaSlug);
  const [selectedZoneSlug, setSelectedZoneSlug] = useState(defaultAbujaSlug);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const paystack = usePaystackCheckout();

  const handleAutofill = useCallback((data: { name: string; email: string }) => {
    setCustomerName((prev) => prev || data.name);
    setCustomerEmail((prev) => prev || data.email);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedZone = zones.find((z) => z.slug === selectedZoneSlug) ?? zones[0];
  const deliveryFee = fulfillment === "DELIVERY" ? (selectedZone?.fee ?? 0) : 0;
  const grandTotal = subtotal + deliveryFee;

  if (!cartHydrated) {
    return (
      <div className="my-12 flex items-center justify-center py-20 text-sm text-deep/50">
        Loading your bag…
      </div>
    );
  }

  if (items.length === 0 && !paystack.busy) {
    return (
      <div className={`my-8 ${surfaceCard} text-center sm:p-10`}>
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
    <>
    <PaystackHandoff
      open={paystack.overlay !== null}
      title={paystack.overlay?.title}
      detail={paystack.overlay?.detail}
      onForceClose={paystack.reset}
    />
    <form
      id={formId}
      aria-busy={paystack.busy}
      className="grid gap-8 lg:grid-cols-12 lg:items-start"
      onSubmit={async (event) => {
        event.preventDefault();
        if (paystack.busy) return;
        const form = new FormData(event.currentTarget);
        const customer = {
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          fulfillment,
          zoneSlug: fulfillment === "DELIVERY" ? selectedZoneSlug : undefined,
          addressLine1: fulfillment === "DELIVERY" ? String(form.get("addressLine1") ?? "").trim() : undefined,
          city:
            fulfillment === "DELIVERY"
              ? String(
                  form.get("city") ??
                    (region === "abuja" ? "Abuja" : region === "nigeria" ? "Nigeria" : ""),
                ).trim()
              : undefined,
          notes: String(form.get("notes") ?? "").trim(),
        };
        const fingerprint = checkoutFingerprint({
          items,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          fulfillment,
          zoneSlug: customer.zoneSlug,
          address: customer.addressLine1,
          notes: customer.notes,
        });
        const saved = readSavedCheckout();
        const resume = saved?.fingerprint === fingerprint ? saved : null;

        const result = await paystack.start(
          () =>
            resume
              ? resumeOrderPayment(resume.token)
              : createCheckout(
                  items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                  })),
                  customer,
                ),
          {
            cancel: "stay",
            cancelMessage: "Payment cancelled. Your bag is still here when you’re ready.",
          },
        );

        if (result?.prices) updatePrices(result.prices);
        if (result?.error && resume && /not found|cancelled|already paid/i.test(result.error)) {
          clearSavedCheckout();
          if (/already paid/i.test(result.error)) router.push(`/orders/${resume.token}`);
          return;
        }
        if (result?.token && result.accessCode) {
          saveCheckout({ token: result.token, fingerprint });
        }
        if (result && !result.error && !result.accessCode && !result.authorizationUrl) {
          clear();
          clearSavedCheckout();
        }
      }}
    >
      {/* Left Column: Form Details */}
      <div className="space-y-6 lg:col-span-7">
        {/* Step 1: Customer Info */}
        <section className={surfaceCard}>
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
              <label className={formLabel} htmlFor="checkout-name">
                Full name *
              </label>
              <input
                id="checkout-name"
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
                <label className={formLabel} htmlFor="checkout-email">
                  Email address *
                </label>
                <input
                  id="checkout-email"
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
                <label className={formLabel} htmlFor="checkout-phone">
                  Phone number *
                </label>
                <input
                  id="checkout-phone"
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
        <section className={surfaceCard}>
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-deep text-xs font-semibold text-cream">
              2
            </span>
            <h2 className="font-display text-xl text-deep">Fulfillment Method</h2>
          </div>

          <div
            className="mt-5 flex rounded-xl border border-deep/12 bg-cream/40 p-1"
            role="radiogroup"
            aria-label="Fulfillment method"
          >
            {(
              [
                { id: "DELIVERY" as const, label: "Delivery" },
                { id: "PICKUP" as const, label: "Shop pickup" },
              ]
            ).map((option) => {
              const active = fulfillment === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFulfillment(option.id)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-center text-[11px] font-medium tracking-[0.12em] uppercase transition ${
                    active
                      ? "bg-white text-deep shadow-[0_1px_2px_rgba(11,44,33,0.08)] ring-1 ring-deep/10"
                      : "text-deep/55 hover:text-deep"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {fulfillment === "DELIVERY" ? (
            <div className="mt-6 space-y-5 border-t border-deep/10 pt-6">
              <DeliveryAreaPicker
                zones={zones}
                region={region}
                value={selectedZoneSlug}
                onRegionChange={(next) => {
                  setRegion(next);
                  const nextSlug = zoneSlugForRegion(next, abujaSlug);
                  setSelectedZoneSlug(nextSlug);
                }}
                onChange={(slug) => {
                  setAbujaSlug(slug);
                  setSelectedZoneSlug(slug);
                  setRegion(deliveryRegionForSlug(slug));
                }}
              />

              <div>
                <label className={formLabel} htmlFor="checkout-address">
                  Street address & landmark *
                </label>
                <input
                  id="checkout-address"
                  name="addressLine1"
                  required
                  placeholder={
                    region === "abuja"
                      ? "e.g. 14 Danube Street, off IBB Way"
                      : "Full street address for the courier"
                  }
                  className={formControl}
                />
              </div>

              {region === "abuja" ? (
                <input type="hidden" name="city" value="Abuja" />
              ) : (
                <div>
                  <label className={formLabel} htmlFor="checkout-city">
                    {region === "international" ? "City / country *" : "City *"}
                  </label>
                  <input
                    id="checkout-city"
                    name="city"
                    required
                    key={region}
                    placeholder={
                      region === "nigeria"
                        ? "e.g. Lagos, Port Harcourt"
                        : "e.g. Accra, Ghana"
                    }
                    className={formControl}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 border-t border-deep/10 pt-6">
              <p className="text-sm font-medium text-deep">Pick up at the shop</p>
              <p className="mt-1 text-sm text-deep/65">{site.address.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-deep/55">
                We’ll pack it and tell you when it’s ready to collect.
              </p>
            </div>
          )}
        </section>

        {/* Step 3: Courier Notes */}
        <section className={surfaceCard}>
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
        <div className={surfaceCard}>
          <h2 className="font-display text-2xl text-deep">Order Summary</h2>

          {/* Itemized lines */}
          <div className="mt-6 divide-y divide-deep/10 overflow-hidden">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 pb-6 pt-3.5 first:pt-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-deep/10 bg-tint/40">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
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

          <button
            type="submit"
            disabled={paystack.busy || items.length === 0}
            className={`mt-6 ${formSubmit}`}
          >
            <PaystackButtonContent phase={paystack.phase} idle={`Pay ${formatNaira(grandTotal)}`} />
          </button>

          <p className="mt-5 border-t border-deep/10 pt-4 text-[11px] leading-5 text-deep/60">
            Paystack opens on this page. If you close it, your bag stays here. Card, transfer, or USSD.
            By paying you agree to our{" "}
            <Link href="/terms" className="text-deep underline decoration-deep/20">
              Terms
            </Link>
            ,{" "}
            <Link href="/shipping" className="text-deep underline decoration-deep/20">
              Shipping
            </Link>
            , and{" "}
            <Link href="/refunds" className="text-deep underline decoration-deep/20">
              Returns & refunds
            </Link>
            .
          </p>
        </div>
      </div>
    </form>
    </>
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
  const mounted = useClientMounted();
  const { isSignedIn, user } = useUser();
  const autofilledRef = useRef(false);

  useEffect(() => {
    if (!mounted || !isSignedIn || !user || autofilledRef.current) return;
    autofilledRef.current = true;
    onAutofill?.({
      name: user.fullName ?? user.firstName ?? "",
      email: user.primaryEmailAddress?.emailAddress ?? "",
    });
  }, [mounted, isSignedIn, user, onAutofill]);

  if (!mounted) {
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
