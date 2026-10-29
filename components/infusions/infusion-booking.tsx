"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { CatalogInfusion } from "@/lib/catalog";

const BookingFlow = dynamic(
  () => import("@/components/booking/booking-flow").then((module) => module.BookingFlow),
  {
    ssr: false,
    loading: () => (
      <p className="py-12 text-center text-sm text-deep/50">Loading booking…</p>
    ),
  },
);

export function InfusionBooking({ drips }: { drips: CatalogInfusion[] }) {
  const searchParams = useSearchParams();
  const drip = searchParams.get("drip");
  const initialSlug = drip && drip.length > 0 ? drip : undefined;

  return <BookingFlow drips={drips} initialSlug={initialSlug} />;
}
