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
    <main className={`${pageAuth} ${pageShell} text-center`}>
      <h1 className="font-display text-4xl text-deep">{title}</h1>
      <p className="mt-3 text-sm text-deep/70">Loading…</p>
    </main>
  );
}
