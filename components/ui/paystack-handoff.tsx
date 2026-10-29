"use client";

import { useEffect } from "react";

export function PaystackHandoff({
  open,
  title = "Opening secure checkout",
  detail = "Stay on this page. Paystack opens in a moment.",
}: {
  open: boolean;
  title?: string;
  detail?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-cream/92 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-deep/10 bg-white px-5 py-8 text-center shadow-sm sm:px-8">
        <span className="mx-auto block size-9 animate-spin rounded-full border-2 border-deep/15 border-t-deep" />
        <p className="mt-5 font-display text-2xl text-deep">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-deep/65">{detail}</p>
        <p className="mt-5 text-[11px] tracking-[0.16em] text-deep/40 uppercase">Secured by Paystack</p>
      </div>
    </div>
  );
}
