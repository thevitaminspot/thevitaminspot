import Link from "next/link";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { listZones } from "@/lib/data";

export const metadata = {
  title: "Checkout · The Vitamin Spot",
  description: "Pay for your packs from The Vitamin Spot in Abuja.",
};

export default async function CheckoutPage() {
  const zones = await listZones();

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-deep/50">
          <Link href="/shop" className="transition hover:text-deep">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-deep">Checkout</span>
        </nav>

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h1 className="font-display text-4xl text-deep md:text-5xl">Finish your order.</h1>
          <p className="text-xs text-deep/60">Paystack · Abuja delivery · CBD pickup</p>
        </div>

        <div className="mt-8 border-t border-deep/10 pt-8">
          <CheckoutForm zones={zones} />
        </div>
      </div>
    </main>
  );
}
