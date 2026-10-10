import Link from "next/link";
import { pageShell, pageWide } from "@/components/ui/layout-styles";
import { site } from "@/lib/site";

export const metadata = {
  title: "Privacy & cookies",
  description: `How ${site.name} uses cookies, local storage, and third-party services.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className={`${pageShell} ${pageWide}`}>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl text-deep md:text-5xl">Privacy & cookies</h1>
        <p className="mt-4 text-sm leading-7 text-deep/70">
          Last updated: 10 October 2026. This page explains what we store in your browser and which
          partners may set cookies when you use {site.name}.
        </p>

        <section className="mt-10 space-y-3 text-sm leading-7 text-deep/75">
          <h2 className="font-display text-2xl text-deep">Who we are</h2>
          <p>
            {site.legalName} ({site.address.label}). Contact:{" "}
            <a href={`mailto:${site.email}`} className="text-deep underline decoration-deep/20">
              {site.email}
            </a>
            .
          </p>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-7 text-deep/75">
          <h2 className="font-display text-2xl text-deep">Essential storage</h2>
          <p>
            These are needed for the site to work. We do not ask for consent before using them.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-deep">Shopping bag</strong> — product lines are
              saved in your browser (local storage) so your bag stays while you browse.
            </li>
            <li>
              <strong className="font-medium text-deep">Sign-in (Clerk)</strong> — if you create an
              account or sign in, Clerk sets cookies to keep you logged in and secure your session.
            </li>
            <li>
              <strong className="font-medium text-deep">Cookie choice</strong> — we remember whether
              you accepted analytics in a first-party cookie named{" "}
              <code className="text-deep">tvs_cookie_consent</code>.
            </li>
            <li>
              <strong className="font-medium text-deep">Payments (Paystack)</strong> — when you pay,
              Paystack may use cookies or similar tech on their checkout pages.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-7 text-deep/75">
          <h2 className="font-display text-2xl text-deep">Analytics (optional)</h2>
          <p>
            If you choose <strong className="font-medium text-deep">Accept all</strong> on the cookie
            banner, we load Vercel Web Analytics to collect anonymous visit data (pages viewed,
            referrers, device type). If you choose <strong className="font-medium text-deep">Essential
            only</strong>, we do not load this script.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-7 text-deep/75">
          <h2 className="font-display text-2xl text-deep">Your choices</h2>
          <p>
            You can change your mind by clearing site data in your browser or deleting cookies for
            this site — the banner will appear again on your next visit. To stop marketing messages,
            contact us directly; we do not sell your data.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-sm leading-7 text-deep/75">
          <h2 className="font-display text-2xl text-deep">Contact form & orders</h2>
          <p>
            Information you send via the contact form, checkout, or booking flow is used to fulfil
            your request, reply by email, or process payment. We keep records as needed for orders,
            appointments, and tax or legal obligations.
          </p>
        </section>

        <p className="mt-12 text-sm text-deep/60">
          <Link href="/contact" className="text-deep underline decoration-deep/20">
            Contact us
          </Link>{" "}
          if you have questions about this policy.
        </p>
      </div>
    </main>
  );
}
