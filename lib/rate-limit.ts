import "server-only";
import { after } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { tryRedis } from "@/lib/redis";

/**
 * Distributed sliding-window rate limiter for Server Actions and Route Handlers.
 * Uses Upstash Redis (@upstash/ratelimit) across Vercel serverless instances when
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_*) are set,
 * and falls back transparently to an in-process sliding window if Redis is
 * unconfigured or unreachable.
 */

export const RATE_POLICIES = {
  /** Start a checkout / create an order */
  checkout: { limit: 5, windowMs: 10 * 60_000, protect: true },
  /** Initialize or resume a Paystack charge */
  paystackInit: { limit: 8, windowMs: 10 * 60_000, protect: true },
  /** Create a new booking */
  booking: { limit: 5, windowMs: 10 * 60_000, protect: true },
  /** Guest cancel / reschedule */
  bookingMutate: { limit: 10, windowMs: 10 * 60_000, protect: true },
  /** Availability slot polling */
  slots: { limit: 45, windowMs: 60_000, protect: false },
  /** Contact form */
  contact: { limit: 3, windowMs: 10 * 60_000, protect: true },
  /** Newsletter / notes signup */
  notes: { limit: 3, windowMs: 10 * 60_000, protect: true },
  /** Client payment-return confirmations */
  paymentConfirm: { limit: 30, windowMs: 60_000, protect: false },
  /** Signed Paystack webhooks (legitimate volume) */
  webhook: { limit: 180, windowMs: 60_000, protect: false },
  /** Failed webhook auth (signature / parse) */
  webhookReject: { limit: 30, windowMs: 60_000, protect: false },
  /** Generic fallback */
  default: { limit: 8, windowMs: 60_000, protect: false },
} as const;

export type RatePolicy = keyof typeof RATE_POLICIES;

type WindowEntry = {
  hits: number[];
  touchedAt: number;
};

const MAX_KEYS = 4_000;
const MAX_WINDOW_MS = 10 * 60_000;
const REDIS_TIMEOUT_MS = 2_500;
const REDIS_WARN_COOLDOWN_MS = 60_000;

const store = new Map<string, WindowEntry>();
const ephemeralCache = new Map<string, number>();
const redisLimiters = new Map<string, Ratelimit>();
let lastSweepAt = 0;
let lastRedisWarnAt = 0;

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

function getRedisLimiter(limit: number, windowMs: number, protect: boolean): Ratelimit | null {
  const redis = tryRedis();
  if (!redis) return null;

  const windowSec = Math.max(1, Math.round(windowMs / 1000));
  const cacheKey = `${limit}:${windowSec}:${protect ? "p" : "n"}`;
  let limiter = redisLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `tvs:rl:${limit}:${windowSec}`,
      ephemeralCache,
      timeout: REDIS_TIMEOUT_MS,
      analytics: true,
      enableProtection: protect,
    });
    redisLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

function flushPending(pending: Promise<unknown>) {
  // Flush Upstash analytics/background sync after the response finishes without adding latency.
  const settled = pending.catch(() => undefined);
  try {
    after(() => settled);
  } catch {
    void settled;
  }
}

function warnRedisFallback(reason: string) {
  const now = Date.now();
  if (now - lastRedisWarnAt < REDIS_WARN_COOLDOWN_MS) return;
  lastRedisWarnAt = now;
  console.warn(`[rate-limit] Upstash Redis ${reason}; falling back to in-memory limiter.`);
}

function memoryRateLimit(key: string, limit: number, window: number): RateLimitResult {
  const now = Date.now();
  prune(now);

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

type RateLimitContext = {
  ip?: string;
  userAgent?: string;
};

/**
 * Sliding-window limiter backed by Upstash Redis (with in-memory fallback).
 * Prefer named policies over raw numbers; legacy `rateLimit(key, limit?, windowMs?)` still works.
 */
export async function rateLimit(
  key: string,
  limitOrPolicy: number | RatePolicy = "default",
  windowMs?: number,
  context?: RateLimitContext,
): Promise<RateLimitResult> {
  let limit: number;
  let window: number;
  let protect = false;

  if (typeof limitOrPolicy === "string") {
    const policy = RATE_POLICIES[limitOrPolicy] ?? RATE_POLICIES.default;
    limit = policy.limit;
    window = policy.windowMs;
    protect = policy.protect;
  } else {
    limit = limitOrPolicy;
    window = windowMs ?? 60_000;
  }

  const limiter = getRedisLimiter(limit, window, protect);
  if (limiter) {
    try {
      const result = await limiter.limit(key, {
        ip: context?.ip,
        userAgent: context?.userAgent,
      });
      flushPending(result.pending);
      if (result.reason === "timeout") {
        warnRedisFallback("timed out");
        return memoryRateLimit(key, limit, window);
      }
      if (!result.success) {
        const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        return { ok: false, remaining: 0, retryAfterSec };
      }
      return { ok: true, remaining: Math.max(0, result.remaining), retryAfterSec: 0 };
    } catch {
      warnRedisFallback("unreachable");
    }
  }

  return memoryRateLimit(key, limit, window);
}

export function rateLimitMessage(retryAfterSec: number) {
  if (retryAfterSec <= 60) {
    return `Please wait ${retryAfterSec}s before trying again.`;
  }
  const minutes = Math.ceil(retryAfterSec / 60);
  return `Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.`;
}

function extractContext(
  headerStore: Headers | { get(name: string): string | null },
  ip: string,
): RateLimitContext {
  const userAgent = headerStore.get("user-agent")?.trim() || undefined;
  return {
    ip: ip !== "local" ? ip : undefined,
    userAgent,
  };
}

/** IP-scoped consume for Server Actions. */
export async function limitByIp(
  headerStore: Headers | { get(name: string): string | null },
  scope: string,
  policy: RatePolicy,
): Promise<RateLimitResult> {
  const ip = getClientIp(headerStore);
  return rateLimit(`${scope}:${ip}`, policy, undefined, extractContext(headerStore, ip));
}

/** IP + normalized email — stops one inbox from being abused across IPs. */
export async function limitByIpAndEmail(
  headerStore: Headers | { get(name: string): string | null },
  scope: string,
  email: string | undefined,
  policy: RatePolicy,
): Promise<RateLimitResult> {
  const ip = getClientIp(headerStore);
  const ctx = extractContext(headerStore, ip);
  const mail = (email ?? "").trim().toLowerCase();
  const ipHit = await rateLimit(`${scope}:ip:${ip}`, policy, undefined, ctx);
  if (!ipHit.ok) return ipHit;
  if (!mail) return ipHit;
  const mailHit = await rateLimit(`${scope}:mail:${mail}`, policy, undefined, ctx);
  if (!mailHit.ok) return mailHit;
  return {
    ok: true,
    remaining: Math.min(ipHit.remaining, mailHit.remaining),
    retryAfterSec: 0,
  };
}
