import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { listCheckoutZones } from "@/lib/sync-zones";
import { pageShell, pageWide } from "@/components/ui/layout-styles";

export const metadata = {
  title: "Checkout · The Vitamin Spot",
  description: "Pay for your packs from The Vitamin Spot in Abuja.",
};

function first(value?: string | string[]) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

async function PaystackReturnRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const orderToken = first(query.order);
  if (!orderToken || !/^[a-f0-9]{48}$/i.test(orderToken)) return null;

  const params = new URLSearchParams();
  const reference = first(query.reference);
  const trxref = first(query.trxref);
  if (reference) params.set("reference", reference);
  if (trxref) params.set("trxref", trxref);
  const qs = params.toString();
  redirect(`/orders/${encodeURIComponent(orderToken)}${qs ? `?${qs}` : ""}`);
}

async function CheckoutBody() {
  const zones = await listCheckoutZones();
  return <CheckoutForm zones={zones} />;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className={pageShell}>
      <Suspense fallback={null}>
        <PaystackReturnRedirect searchParams={searchParams} />
      </Suspense>
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
            <CheckoutBody />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
