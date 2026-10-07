import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { listInfusions } from "@/lib/data";

export const metadata = {
  title: "Book an IV drip in Abuja",
  description:
    "Book an IV drip at The Vitamin Spot in Abuja. Energy, Glow, Hydration, Immunity, Myers, and Recovery. Walk in or pick a time online.",
  alternates: { canonical: "/infusions" },
};

async function InfusionPicker({
  searchParams,
  drips,
}: {
  searchParams: PageProps<"/infusions">["searchParams"];
  drips: Awaited<ReturnType<typeof listInfusions>>;
}) {
  const params = await searchParams;
  const initialSlug = typeof params.drip === "string" ? params.drip : undefined;

  return <BookingFlow drips={drips} initialSlug={initialSlug} />;
}

export default async function InfusionsPage({
  searchParams,
}: PageProps<"/infusions">) {
  const drips = await listInfusions();

  return (
    <main className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-4xl text-deep md:text-5xl">Book an IV drip</h1>
        <p className="mt-3 text-sm text-deep/65">
          The Vitamin Spot · Abuja · About 60 minutes per session
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-deep/10 bg-white/60 px-4 py-10 text-center text-sm text-deep/50">
              Loading drips…
            </div>
          }
        >
          <InfusionPicker searchParams={searchParams} drips={drips} />
        </Suspense>
      </div>
      <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-deep/45">
        Tell us if you’re pregnant, on medication, or have allergies. This is wellness care, not
        emergency treatment.
      </p>
    </main>
  );
}
