"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Subtle, LCP-safe route transition that settles content smoothly on client navigation. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-settle">
      {children}
    </div>
  );
}
