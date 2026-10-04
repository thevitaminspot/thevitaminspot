import { CheckoutForm } from "@/components/shop/checkout-form";
import { listZones } from "@/lib/data";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const zones = await listZones();
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-display text-5xl">Checkout</h1>
      <CheckoutForm zones={zones} />
    </main>
  );
}
