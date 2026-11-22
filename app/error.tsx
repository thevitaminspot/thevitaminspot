"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { site, whatsappHref } from "@/lib/site";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-lg rounded-2xl border border-deep/10 bg-white p-7 text-center sm:p-10">
        <p className="text-[11px] font-medium tracking-[0.22em] text-deep/55 uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 font-display text-3xl text-deep sm:text-4xl">
          We couldn’t load that page.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-deep/70">
          Please try again. If this happened during checkout or booking, message our lounge and
          we’ll sort it out right away.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary rounded-full px-6 py-3 text-[11px] font-medium tracking-[0.16em] uppercase"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-deep/15 bg-cream/60 px-6 py-3 text-[11px] font-medium tracking-[0.16em] text-deep uppercase transition hover:border-deep/30 hover:bg-cream"
          >
            Back home
          </Link>
        </div>
        <p className="mt-6 text-xs text-deep/60">
          Need help?{" "}
          <a
            href={whatsappHref(`Hi ${site.name}, I ran into a page error on the site.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep"
          >
            WhatsApp {site.name}
          </a>
        </p>
      </div>
    </main>
  );
}
