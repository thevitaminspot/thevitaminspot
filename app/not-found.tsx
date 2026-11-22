import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFoundPage() {
  return (
    <main className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-lg rounded-2xl border border-deep/10 bg-white p-7 text-center sm:p-10">
        <p className="text-[11px] font-medium tracking-[0.22em] text-deep/55 uppercase">404</p>
        <h1 className="mt-3 font-display text-4xl text-deep sm:text-5xl">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep/70">
          That link may have moved or expired. Explore take-home vitamin packs or reserve an IV
          drip at {site.name}.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="btn-primary rounded-full px-6 py-3 text-[11px] font-medium tracking-[0.16em] uppercase"
          >
            Shop packs
          </Link>
          <Link
            href="/infusions"
            className="rounded-full border border-deep/15 bg-cream/60 px-6 py-3 text-[11px] font-medium tracking-[0.16em] text-deep uppercase transition hover:border-deep/30 hover:bg-cream"
          >
            Book a drip
          </Link>
        </div>
        <p className="mt-6 text-xs text-deep/60">
          <Link
            href="/"
            className="font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep"
          >
            Return to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}
