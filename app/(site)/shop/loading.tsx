import { pageShell, pageWide } from "@/components/ui/layout-styles";

export default function ShopLoading() {
  return (
    <main className={pageShell}>
      <div className={pageWide}>
        <div className="h-12 w-40 animate-pulse rounded bg-deep/10" />
        <div className="mt-8 h-14 animate-pulse rounded-2xl bg-deep/5" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-deep/5" />
          ))}
        </div>
      </div>
    </main>
  );
}
