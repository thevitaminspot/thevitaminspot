const tones: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200/80",
  PAID: "bg-sage/15 text-deep ring-sage/30",
  CONFIRMED: "bg-sage/15 text-deep ring-sage/30",
  PACKED: "bg-cream text-deep ring-deep/10",
  OUT_FOR_DELIVERY: "bg-cream text-deep ring-deep/10",
  DELIVERED: "bg-deep/5 text-deep/70 ring-deep/10",
  CANCELLED: "bg-deep/[0.04] text-deep/55 ring-deep/10",
  COMPLETED: "bg-deep/5 text-deep/70 ring-deep/10",
};

export function AccountStatusBadge({ status }: { status: string }) {
  const tone = tones[status] ?? "bg-deep/5 text-deep/70 ring-deep/10";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] uppercase ring-1 ring-inset ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
