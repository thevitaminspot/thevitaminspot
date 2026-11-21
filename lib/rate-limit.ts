import "server-only";

/**
 * In-process sliding-window rate limiter for Server Actions and Route Handlers.
 * Survives per-instance on Node; across serverless isolates limits are per isolate
 * (still blocks single-IP hammering and scripted abuse on a given instance).
 */

export const RATE_POLICIES = {
  /** Start a checkout / create an order */
  checkout: { limit: 5, windowMs: 10 * 60_000 },
  /** Initialize or resume a Paystack charge */
  paystackInit: { limit: 8, windowMs: 10 * 60_000 },
  /** Create a new booking */
  booking: { limit: 5, windowMs: 10 * 60_000 },
  /** Guest cancel / reschedule */
  bookingMutate: { limit: 10, windowMs: 10 * 60_000 },
  /** Availability slot polling */
  slots: { limit: 45, windowMs: 60_000 },
  /** Contact form */
  contact: { limit: 3, windowMs: 10 * 60_000 },
  /** Newsletter / notes signup */
  notes: { limit: 3, windowMs: 10 * 60_000 },
  /** Client payment-return confirmations */
  paymentConfirm: { limit: 30, windowMs: 60_000 },
  /** Signed Paystack webhooks (legitimate volume) */
  webhook: { limit: 180, windowMs: 60_000 },
  /** Failed webhook auth (signature / parse) */
  webhookReject: { limit: 30, windowMs: 60_000 },
  /** Generic fallback */
  default: { limit: 8, windowMs: 60_000 },
} as const;

export type RatePolicy = keyof typeof RATE_POLICIES;

type WindowEntry = {
  hits: number[];
  touchedAt: number;
};

const MAX_KEYS = 4_000;
const MAX_WINDOW_MS = 10 * 60_000;
const store = new Map<string, WindowEntry>();
let lastSweepAt = 0;

function prune(now: number) {
  // Periodic sweep (at most once per 30s) + O(1) FIFO eviction using Map insertion order.
  if (now - lastSweepAt >= 30_000) {
    lastSweepAt = now;
    let checked = 0;
    for (const [key, entry] of store) {
      if (checked++ >= 128) break;
      entry.hits = entry.hits.filter((t) => now - t < MAX_WINDOW_MS);
      if (entry.hits.length === 0 && now - entry.touchedAt > MAX_WINDOW_MS) {
        store.delete(key);
      }
    }
  }

  while (store.size > MAX_KEYS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

export function getClientIp(headerStore: Headers | { get(name: string): string | null }) {
  // On Vercel, x-vercel-forwarded-for is set by the edge platform and cannot be spoofed by clients.
  const vercelIp = headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}

export type RateLimitResult =
  | { ok: true; remaining: number; retryAfterSec: 0 }
  | { ok: false; remaining: 0; retryAfterSec: number };

/**
 * Sliding-window limiter. Prefer named policies over raw numbers.
 * Legacy signature `rateLimit(key, limit?, windowMs?)` still works.
 */
export function rateLimit(
  key: string,
  limitOrPolicy: number | RatePolicy = "default",
  windowMs?: number,
): RateLimitResult {
  const now = Date.now();
  prune(now);

  let limit: number;
  let window: number;

  if (typeof limitOrPolicy === "string") {
    const policy = RATE_POLICIES[limitOrPolicy] ?? RATE_POLICIES.default;
    limit = policy.limit;
    window = policy.windowMs;
  } else {
    limit = limitOrPolicy;
    window = windowMs ?? 60_000;
  }

  const entry = store.get(key) ?? { hits: [], touchedAt: now };
  entry.hits = entry.hits.filter((t) => now - t < window);

  if (entry.hits.length >= limit) {
    const oldest = entry.hits[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + window - now) / 1000));
    entry.touchedAt = now;
    store.set(key, entry);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  entry.hits.push(now);
  entry.touchedAt = now;
  store.set(key, entry);
  return { ok: true, remaining: limit - entry.hits.length, retryAfterSec: 0 };
}

export function rateLimitMessage(retryAfterSec: number) {
  if (retryAfterSec <= 60) {
    return `Please wait ${retryAfterSec}s before trying again.`;
  }
  const minutes = Math.ceil(retryAfterSec / 60);
  return `Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.`;
}

/** IP-scoped consume for Server Actions. */
export function limitByIp(
  headerStore: Headers | { get(name: string): string | null },
  scope: string,
  policy: RatePolicy,
): RateLimitResult {
  const ip = getClientIp(headerStore);
  return rateLimit(`${scope}:${ip}`, policy);
}

/** IP + normalized email — stops one inbox from being abused across IPs. */
export function limitByIpAndEmail(
  headerStore: Headers | { get(name: string): string | null },
  scope: string,
  email: string | undefined,
  policy: RatePolicy,
): RateLimitResult {
  const ip = getClientIp(headerStore);
  const mail = (email ?? "").trim().toLowerCase();
  const ipHit = rateLimit(`${scope}:ip:${ip}`, policy);
  if (!ipHit.ok) return ipHit;
  if (!mail) return ipHit;
  const mailHit = rateLimit(`${scope}:mail:${mail}`, policy);
  if (!mailHit.ok) return mailHit;
  return {
    ok: true,
    remaining: Math.min(ipHit.remaining, mailHit.remaining),
    retryAfterSec: 0,
  };
}
