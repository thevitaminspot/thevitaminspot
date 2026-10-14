import { Suspense } from "react";
import { InfusionBooking } from "@/components/infusions/infusion-booking";
import { pageNarrow, pageShell } from "@/components/ui/layout-styles";
import { listInfusions } from "@/lib/data";

export const metadata = {
  title: "Book an IV drip in Abuja",
  description:
    "Book an IV drip at The Vitamin Spot in Abuja. Energy, Glow, Hydration, Immunity, Myers, and Recovery. Walk in or pick a time online.",
  alternates: { canonical: "/infusions" },
};

export default async function InfusionsPage() {
  const drips = await listInfusions();

  return (
    <main className={pageShell}>
      <div className={`${pageNarrow} text-center`}>
        <h1 className="font-display text-4xl text-deep md:text-5xl">Book an IV drip</h1>
        <p className="mt-3 text-sm text-deep/65">The Vitamin Spot · Abuja</p>
        <p className="mt-2 text-sm leading-relaxed text-deep/55">
          Pick your drip, choose a time, and pay the booking fee online. Most sessions take about an hour.
        </p>
      </div>
      <div className={`${pageNarrow} mt-8`}>
        <Suspense
          fallback={
            <p className="py-12 text-center text-sm text-deep/50">Loading…</p>
          }
        >
          <InfusionBooking drips={drips} />
        </Suspense>
      </div>
      <p className={`${pageNarrow} mt-8 text-center text-xs leading-relaxed text-deep/45`}>
        Tell us if you’re pregnant, on medication, or have allergies. Wellness care only — not
        emergency treatment.
      </p>
    </main>
  );
}
