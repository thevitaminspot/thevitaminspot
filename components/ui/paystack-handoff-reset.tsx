"use client";

import { useEffect } from "react";

/** Clear stuck Paystack handoff when the user returns via browser back (bfcache). */
export function PaystackHandoffReset({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) onReset();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [onReset]);

  return null;
}
