export default function AdminOrderLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-3 w-24 rounded bg-deep/10" />
      <div className="space-y-3 border-b border-deep/8 pb-7">
        <div className="h-3 w-16 rounded bg-deep/10" />
        <div className="h-9 w-48 rounded bg-deep/10" />
        <div className="h-4 w-64 rounded bg-deep/10" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-64 rounded-2xl bg-deep/5" />
        <div className="h-64 rounded-2xl bg-deep/5" />
      </div>
    </div>
  );
}
