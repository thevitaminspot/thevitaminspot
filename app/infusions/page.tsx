import { BookingFlow } from "@/components/booking/booking-flow";
import { listInfusions } from "@/lib/data";

export const metadata = {
  title: "Book an infusion",
  description: "Book an IV at The Vitamin Spot in Abuja. Pick a drip, a day, and a time.",
};

export default async function InfusionsPage({
  searchParams,
}: PageProps<"/infusions">) {
  const drips = await listInfusions();
  const params = await searchParams;
  const initialSlug = typeof params.drip === "string" ? params.drip : undefined;

  return (
    <main className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl text-deep md:text-7xl">Book an IV.</h1>
        <p className="mt-4 max-w-xl text-deep/70">Pick one, then a day.</p>
        <div className="mt-10">
          <BookingFlow drips={drips} initialSlug={initialSlug} />
        </div>
        <p className="mt-10 max-w-2xl text-xs leading-6 text-deep/50">
          Tell us if you’re pregnant, on medication, or anything else we should know. This isn’t
          emergency care.
        </p>
      </div>
    </main>
  );
}
