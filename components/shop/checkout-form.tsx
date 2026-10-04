"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckout } from "@/actions/checkout";
import { formatNaira } from "@/lib/money";
import type { CatalogZone } from "@/lib/catalog";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutForm({ zones }: { zones: CatalogZone[] }) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <form
      className="mt-10 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        const result = await createCheckout(
          items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            phone: String(form.get("phone") ?? ""),
            fulfillment,
            zoneSlug: String(form.get("zoneSlug") ?? ""),
            addressLine1: String(form.get("addressLine1") ?? ""),
            city: String(form.get("city") ?? ""),
            notes: String(form.get("notes") ?? ""),
          },
        );
        setPending(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        clear();
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        router.push(`/orders/${result.token}`);
      }}
    >
      <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
      <input name="phone" required placeholder="Phone" className="w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
      <div className="flex gap-3">
        {(["DELIVERY", "PICKUP"] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => setFulfillment(method)}
            className={`rounded-lg px-4 py-2 text-[11px] tracking-[0.16em] uppercase ${
              fulfillment === method ? "bg-deep text-cream" : "bg-white/50"
            }`}
          >
            {method === "DELIVERY" ? "Deliver" : "Pickup"}
          </button>
        ))}
      </div>
      {fulfillment === "DELIVERY" ? (
        <>
          <select name="zoneSlug" className="w-full rounded-lg border border-deep/15 bg-cream px-5 py-3" defaultValue={zones[0]?.slug}>
            {zones.map((zone) => (
              <option key={zone.slug} value={zone.slug}>
                {zone.name} · {formatNaira(zone.fee)} · {zone.eta}
              </option>
            ))}
          </select>
          <input name="addressLine1" placeholder="Street address" className="w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
          <input name="city" placeholder="City" defaultValue="Abuja" className="w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
        </>
      ) : null}
      <textarea name="notes" placeholder="A note for the courier" className="min-h-24 w-full rounded-lg border border-deep/15 bg-transparent px-5 py-3" />
      <p className="text-sm">Bag {formatNaira(subtotal)}</p>
      {error ? <p className="text-sm">{error}</p> : null}
      <button
        disabled={pending || items.length === 0}
        className="w-full rounded-lg bg-deep py-3 text-[11px] tracking-[0.2em] text-cream uppercase disabled:opacity-40"
      >
        Pay with Paystack
      </button>
    </form>
  );
}
