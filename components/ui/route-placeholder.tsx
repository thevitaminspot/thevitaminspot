/** Quiet cream placeholder for route/auth Suspense — no loading theatre. */
export function RoutePlaceholder() {
  return (
    <div className="animate-pulse space-y-4 py-2" aria-hidden>
      <div className="h-8 w-40 rounded bg-deep/10" />
      <div className="h-4 w-64 max-w-full rounded bg-deep/8" />
      <div className="mt-6 h-40 rounded-2xl bg-deep/5" />
      <div className="h-24 rounded-2xl bg-deep/5" />
    </div>
  );
}
