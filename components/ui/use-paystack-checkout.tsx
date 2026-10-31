"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notifyError } from "@/lib/notify";

export type PaystackPhase = "idle" | "preparing" | "open" | "confirming";

export type PaystackLaunch = {
  error?: string;
  prices?: Record<string, number>;
  token?: string;
  accessCode?: string;
  authorizationUrl?: string;
  reference?: string;
  returnPath?: string;
};

type Overlay = { title: string; detail: string };

const preparingOverlay: Overlay = {
  title: "Preparing payment",
  detail: "Creating a secure Paystack session. Don’t close this tab.",
};

/** Hard cap so a stuck handoff never blocks the page until refresh. */
const OVERLAY_MAX_MS = 45_000;

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function readReference(
  response: { reference?: string; trxref?: string } | undefined,
  fallback?: string,
) {
  return response?.reference || response?.trxref || fallback || "";
}

function readError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Paystack could not open. Please try again.";
}

export function paystackButtonLabel(phase: PaystackPhase, idleLabel: string) {
  if (phase === "preparing") return "Preparing…";
  if (phase === "open") return "Complete payment…";
  if (phase === "confirming") return "Confirming…";
  return idleLabel;
}

export function PaystackButtonContent({
  phase,
  idle,
}: {
  phase: PaystackPhase;
  idle: string;
}) {
  const label = paystackButtonLabel(phase, idle);
  if (phase === "idle") return label;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span
        className="size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
        aria-hidden
      />
      {label}
    </span>
  );
}

export function usePaystackCheckout() {
  const router = useRouter();
  const [phase, setPhase] = useState<PaystackPhase>("idle");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const lock = useRef(false);
  const openTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const phaseRef = useRef<PaystackPhase>("idle");

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (safetyTimer.current) {
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  const idle = useCallback(() => {
    lock.current = false;
    phaseRef.current = "idle";
    setPhase("idle");
    setOverlay(null);
    clearTimers();
  }, [clearTimers]);

  const fail = useCallback(
    (message: string) => {
      notifyError(message);
      idle();
    },
    [idle],
  );

  const armSafety = useCallback(() => {
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    safetyTimer.current = window.setTimeout(() => {
      if (phaseRef.current === "idle") return;
      notifyError("Payment timed out. You can try again when you’re ready.");
      idle();
    }, OVERLAY_MAX_MS);
  }, [idle]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) idle();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      clearTimers();
    };
  }, [idle, clearTimers]);

  const start = useCallback(
    async (
      request: () => Promise<PaystackLaunch>,
      options?: { cancel?: "stay" | "leave"; cancelMessage?: string },
    ) => {
      if (lock.current) return undefined;
      lock.current = true;
      phaseRef.current = "preparing";
      setPhase("preparing");
      setOverlay(preparingOverlay);
      armSafety();
      const cancelMode = options?.cancel ?? "leave";
      const cancelMessage =
        options?.cancelMessage ?? "Payment cancelled. You can try again when you’re ready.";

      let result: PaystackLaunch;
      try {
        result = await request();
      } catch {
        fail("Something went wrong. Please try again.");
        return undefined;
      }

      if (result.error) {
        fail(result.error);
        return result;
      }

      if (!result.accessCode || !result.returnPath) {
        if (result.authorizationUrl) {
          window.location.assign(result.authorizationUrl);
          return result;
        }
        if (result.returnPath) {
          router.push(result.returnPath);
          return result;
        }
        fail("Could not open Paystack. Please try again.");
        return result;
      }

      const returnPath = result.returnPath;
      const fallbackReference = result.reference;
      const authorizationUrl = result.authorizationUrl;
      let settled = false;

      const confirm = (nextOverlay: Overlay, path: string) => {
        if (settled) return;
        settled = true;
        clearTimers();
        phaseRef.current = "confirming";
        setPhase("confirming");
        setOverlay(nextOverlay);
        armSafety();
        router.push(path);
      };

      try {
        const { default: PaystackPop } = await import("@paystack/inline-js");
        const popup = new PaystackPop();
        let opened = false;
        const markOpen = () => {
          if (settled || opened) return;
          opened = true;
          phaseRef.current = "open";
          setPhase("open");
          setOverlay(null);
        };

        popup.newTransaction({
          accessCode: result.accessCode,
          onLoad: () => markOpen(),
          onSuccess: (response) => {
            const reference = readReference(response, fallbackReference);
            if (!reference) {
              settled = true;
              fail(
                "Paystack confirmed the payment, but the reference was missing. Open your order from the email we sent.",
              );
              return;
            }
            confirm(
              {
                title: "Confirming payment",
                detail: "Hang tight while we verify your payment with Paystack.",
              },
              withQuery(returnPath, "reference", reference),
            );
          },
          onBankTransferConfirmationPending: (response) => {
            const reference = readReference(response, fallbackReference);
            confirm(
              {
                title: "Waiting for your transfer",
                detail: "We’ll keep checking until Paystack confirms the payment.",
              },
              reference ? withQuery(returnPath, "reference", reference) : returnPath,
            );
          },
          onCancel: () => {
            // Paystack fires cancel before the bank-transfer callback. Wait a tick so a
            // transfer that is still confirming is not treated as a cancelled payment.
            queueMicrotask(() => {
              if (settled) return;
              settled = true;
              clearTimers();
              if (cancelMode === "stay") {
                notifyError(cancelMessage);
                idle();
                return;
              }
              phaseRef.current = "confirming";
              setPhase("confirming");
              setOverlay({
                title: "Payment cancelled",
                detail: "Taking you back so you can try again.",
              });
              armSafety();
              router.push(withQuery(returnPath, "payment", "cancelled"));
            });
          },
          onError: (paystackError) => {
            if (settled) return;
            settled = true;
            clearTimers();
            if (!opened && authorizationUrl) {
              window.location.assign(authorizationUrl);
              return;
            }
            fail(readError(paystackError));
          },
        });

        if (openTimer.current) window.clearTimeout(openTimer.current);
        openTimer.current = window.setTimeout(markOpen, 1200);
      } catch {
        if (authorizationUrl) {
          window.location.assign(authorizationUrl);
          return result;
        }
        fail("Could not open Paystack. Please try again.");
      }

      return result;
    },
    [armSafety, clearTimers, fail, idle, router],
  );

  return {
    phase,
    overlay,
    /** @deprecated Prefer toast via fail(); kept empty for call-site cleanup. */
    error: "",
    busy: phase !== "idle",
    start,
    reset: idle,
  };
}
