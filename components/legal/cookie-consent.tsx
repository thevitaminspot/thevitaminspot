"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  allowsAnalytics,
  readConsentFromDocument,
  writeConsentCookie,
  type ConsentChoice,
} from "@/lib/cookie-consent";

type ConsentContextValue = {
  consent: ConsentChoice | null;
  setConsent: (choice: ConsentChoice) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const consentListeners = new Set<() => void>();

function subscribeConsent(onStoreChange: () => void) {
  consentListeners.add(onStoreChange);
  return () => {
    consentListeners.delete(onStoreChange);
  };
}

function emitConsentChange() {
  for (const listener of consentListeners) listener();
}

function getConsentSnapshot() {
  return readConsentFromDocument();
}

function getServerConsentSnapshot(): ConsentChoice | null {
  return null;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  const setConsent = useCallback((choice: ConsentChoice) => {
    writeConsentCookie(choice);
    emitConsentChange();
  }, []);

  const value = useMemo(() => ({ consent, setConsent }), [consent, setConsent]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {allowsAnalytics(consent) ? <Analytics /> : null}
      {consent === null ? <CookieBanner onChoose={setConsent} /> : null}
    </ConsentContext.Provider>
  );
}

function CookieBanner({ onChoose }: { onChoose: (choice: ConsentChoice) => void }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-deep/10 bg-cream/95 p-4 shadow-[0_-8px_30px_rgba(11,44,33,0.08)] backdrop-blur-md sm:p-5"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 text-sm leading-relaxed text-deep/75">
          <p id="cookie-banner-title" className="font-medium text-deep">
            Cookies on this site
          </p>
          <p id="cookie-banner-desc" className="mt-1">
            We use essential cookies for sign-in and checkout, and optional analytics to see how the
            shop is used.{" "}
            <Link href="/privacy" className="text-deep underline decoration-deep/25 underline-offset-2">
              Privacy & cookies
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onChoose("essential")}
            className="rounded-xl border border-deep/15 px-5 py-3 text-[11px] font-medium tracking-[0.14em] text-deep uppercase transition hover:bg-tint/50"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => onChoose("all")}
            className="rounded-xl bg-deep px-5 py-3 text-[11px] font-medium tracking-[0.14em] text-cream uppercase transition hover:bg-[#14382a]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
