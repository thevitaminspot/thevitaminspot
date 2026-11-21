"use client";

import { useSearchParams } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { CatalogInfusion } from "@/lib/catalog";

export function InfusionBooking({ drips }: { drips: CatalogInfusion[] }) {
  const searchParams = useSearchParams();
  const drip = searchParams.get("drip");
  const initialSlug = drip && drip.length > 0 ? drip : undefined;

  return <BookingFlow drips={drips} initialSlug={initialSlug} />;
}
