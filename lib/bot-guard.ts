import "server-only";
import { checkBotId } from "botid/server";

export type BotGuardResult = { ok: true } | { ok: false; error: string };

/**
 * Invisible bot check via Vercel BotID for public write/payment Server Actions.
 * Automatically allows requests in local development; enforces strictly on Vercel.
 */
export async function assertHumanRequest(): Promise<BotGuardResult> {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  try {
    const verdict = await checkBotId();
    if (verdict.isBot && !verdict.bypassed) {
      return {
        ok: false,
        error: "We couldn’t verify this request. Please refresh the page and try again.",
      };
    }
    return { ok: true };
  } catch (error) {
    // Only fail open if running outside Vercel (no OIDC token); on Vercel, fail closed.
    if (!process.env.VERCEL) {
      return { ok: true };
    }
    console.warn("[botid] Verification failed:", error instanceof Error ? error.message : "unknown");
    return {
      ok: false,
      error: "We couldn’t verify this request. Please refresh the page and try again.",
    };
  }
}
