import Link from "next/link";
import { pageShell, pageWide } from "@/components/ui/layout-styles";

const policyNav = [
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping" },
  { href: "/refunds", label: "Returns & refunds" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function PolicyShell({
  title,
  intro,
  updated = "29 October 2026",
  children,
}: {
  title: string;
  intro: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`${pageShell} ${pageWide}`}>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl text-deep md:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-deep/70">
          Last updated: {updated}. {intro}
        </p>

        <nav
          aria-label="Policies"
          className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-deep/10 py-3 text-[11px] tracking-[0.14em] text-deep/45 uppercase"
        >
          {policyNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-deep">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-2">{children}</div>
      </div>
    </main>
  );
}

export function PolicySection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24 space-y-3 text-sm leading-7 text-deep/75">
      <h2 className="font-display text-2xl text-deep">{title}</h2>
      {children}
    </section>
  );
}
