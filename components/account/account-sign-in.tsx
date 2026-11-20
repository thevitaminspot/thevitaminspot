import Link from "next/link";
import { formButtonSecondary, formSubmitInline } from "@/components/ui/form-styles";
import { pageAuth, pageShell } from "@/components/ui/layout-styles";

export function AccountSignInPrompt({
  title,
  lede,
}: {
  title: string;
  lede: string;
}) {
  return (
    <main className={`${pageAuth} ${pageShell} text-center`}>
      <h1 className="font-display text-4xl text-deep">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-deep/70">{lede}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={formSubmitInline}>
          Sign in
        </Link>
        <Link href="/sign-up" className={formButtonSecondary}>
          Create account
        </Link>
      </div>
      <div className="mt-12 rounded-2xl border border-deep/10 bg-white/60 p-4 text-xs text-deep/65">
        <p className="font-medium text-deep">Checking out or booking as a guest?</p>
        <p className="mt-1">You don&apos;t need an account to buy a pack or book a drip.</p>
        <div className="mt-3 flex items-center justify-center gap-3 font-medium text-deep">
          <Link href="/shop" className="underline hover:text-sage">
            See the packs
          </Link>
          <span className="text-deep/30">·</span>
          <Link href="/infusions" className="underline hover:text-sage">
            Book a drip
          </Link>
        </div>
      </div>
    </main>
  );
}

export function AccountLoadingFallback({ title }: { title: string }) {
  return (
    <main className={`${pageShell} mx-auto max-w-6xl`} aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.24em] text-deep/45 uppercase">Account</p>
          <h1 className="mt-2 font-display text-4xl text-deep sm:text-5xl">{title}</h1>
          <div className="mt-3 h-4 w-36 animate-pulse rounded bg-deep/10" />
        </div>
        <div className="flex gap-3">
          <div className="h-4 w-20 animate-pulse rounded bg-deep/8" />
          <div className="h-4 w-20 animate-pulse rounded bg-deep/8" />
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-deep/10 bg-white">
        <div className="border-b border-deep/10 bg-cream/40 px-5 py-3">
          <div className="flex gap-8">
            <div className="h-3 w-16 animate-pulse rounded bg-deep/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-deep/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-deep/10" />
            <div className="ml-auto h-3 w-14 animate-pulse rounded bg-deep/10" />
          </div>
        </div>
        <ul className="divide-y divide-deep/8" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-4 px-5 py-4">
              <div className="size-10 shrink-0 animate-pulse rounded-lg bg-deep/8" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-40 max-w-full animate-pulse rounded bg-deep/10" />
                <div className="h-3 w-28 max-w-full animate-pulse rounded bg-deep/8" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-deep/8" />
              <div className="hidden h-3.5 w-16 animate-pulse rounded bg-deep/10 sm:block" />
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only">Loading {title}</p>
    </main>
  );
}
