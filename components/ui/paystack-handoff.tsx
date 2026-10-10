"use client";

export function PaystackHandoff({
  open,
  title = "Opening Paystack",
  detail = "Stay on this page. Payment opens in a moment.",
}: {
  open: boolean;
  title?: string;
  detail?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-cream/90 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-deep/10 bg-white p-5 text-center sm:p-6">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-deep/15 border-t-deep" />
        <p className="mt-5 font-display text-2xl text-deep">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-deep/65">{detail}</p>
      </div>
    </div>
  );
}
