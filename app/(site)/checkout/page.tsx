import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { listZones } from "@/lib/data";
import { pageShell, pageWide } from "@/components/ui/layout-styles";

export const metadata = {
  title: "Checkout · The Vitamin Spot",
  description: "Pay for your packs from The Vitamin Spot in Abuja.",
};

function first(value?: string | string[]) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const orderToken = first(query.order);
  if (orderToken) {
    const params = new URLSearchParams();
    const reference = first(query.reference);
    const trxref = first(query.trxref);
    if (reference) params.set("reference", reference);
    if (trxref) params.set("trxref", trxref);
    const qs = params.toString();
    redirect(`/orders/${orderToken}${qs ? `?${qs}` : ""}`);
  }

  const zones = await listZones();

  return (
    <main className={pageShell}>
      <div className={pageWide}>
        <nav className="flex items-center gap-2 text-xs text-deep/50">
          <Link href="/shop" className="transition hover:text-deep">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-deep">Checkout</span>
        </nav>

        <div className="mt-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <h1 className="font-display text-4xl text-deep md:text-5xl">Pay for your order</h1>
          <p className="text-xs text-deep/60">Card, transfer, or USSD · Abuja delivery or shop pickup</p>
        </div>

        <div className="mt-8 border-t border-deep/10 pt-8">
          <Suspense
            fallback={
              <div className="py-20 text-center text-sm text-deep/50">Loading checkout…</div>
            }
          >
            <CheckoutForm zones={zones} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
