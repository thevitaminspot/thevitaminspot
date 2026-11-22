import "server-only";
import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const REDIS_KEYS = {
  products: "tvs:catalog:products",
  productsStale: "tvs:catalog:products:stale",
  infusions: "tvs:catalog:infusions",
  infusionsStale: "tvs:catalog:infusions:stale",
  zones: "tvs:catalog:zones",
  zonesStale: "tvs:catalog:zones:stale",
  checkoutZones: "tvs:catalog:checkout-zones",
  checkoutZonesStale: "tvs:catalog:checkout-zones:stale",
  categories: "tvs:catalog:categories",
  categoriesStale: "tvs:catalog:categories:stale",
  availabilityRules: "tvs:avail:rules",
  availabilityVersion: "tvs:avail:ver",
  siteTraffic: "tvs:analytics:traffic",
} as const;

export type CatalogCacheScope = "products" | "infusions" | "zones" | "categories";

function resolveRedisCredentials() {
  // Support both standard Upstash names and Vercel Marketplace KV-prefixed names.
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim() ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim() ||
    "";

  return { url, token };
}

export function hasRedis() {
  const { url, token } = resolveRedisCredentials();
  return (
    url.startsWith("https://") &&
    !url.includes("replace_me") &&
    token.length > 0 &&
    !token.includes("replace_me")
  );
}

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    const { url, token } = resolveRedisCredentials();
    if (!url || !token) {
      throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    globalForRedis.redis = new Redis({ url, token });
  }
  return globalForRedis.redis;
}

export function tryRedis(): Redis | null {
  if (!hasRedis()) return null;
  try {
    return getRedis();
  } catch {
    return null;
  }
}

/** Safe JSON read from Redis; returns null if unconfigured, missing, or unreachable. */
export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = tryRedis();
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

/** Safe JSON write with TTL in seconds; never throws if Redis is down. */
export async function redisSet(key: string, value: unknown, exSeconds: number): Promise<void> {
  const redis = tryRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: Math.max(1, Math.round(exSeconds)) });
  } catch {
    // Ignore cache write failures so storefront/API requests never fail.
  }
}

/** Safe delete for one or more Redis keys. */
export async function redisDel(...keys: string[]): Promise<void> {
  const redis = tryRedis();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Ignore cache invalidation failures; TTLs bound staleness.
  }
}

/**
 * Atomic SET NX EX lock/dedup guard.
 * Returns true if this caller acquired the key (or if Redis is unconfigured/unreachable so
 * processing can continue safely via database idempotency), and false if already claimed.
 */
export async function redisAcquireOnce(key: string, exSeconds: number): Promise<boolean> {
  const redis = tryRedis();
  if (!redis) return true;
  try {
    const result = await redis.set(key, "1", { nx: true, ex: Math.max(1, Math.round(exSeconds)) });
    return result === "OK";
  } catch {
    return true;
  }
}

export async function redisGetVersion(versionKey: string): Promise<number> {
  const redis = tryRedis();
  if (!redis) return 0;
  try {
    const raw = await redis.get<number | string>(versionKey);
    const parsed = typeof raw === "number" ? raw : Number(raw ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function redisBumpVersion(versionKey: string): Promise<void> {
  const redis = tryRedis();
  if (!redis) return;
  try {
    await redis.incr(versionKey);
  } catch {
    // Ignore bump failures; slot TTL bounds staleness.
  }
}

/** Invalidate fresh catalog keys immediately while keeping stale snapshots for outage fallback. */
export async function invalidateCatalogCache(...scopes: CatalogCacheScope[]): Promise<void> {
  const keys: string[] = [];
  for (const scope of scopes) {
    if (scope === "products") keys.push(REDIS_KEYS.products);
    if (scope === "infusions") keys.push(REDIS_KEYS.infusions);
    if (scope === "zones") keys.push(REDIS_KEYS.zones, REDIS_KEYS.checkoutZones);
    if (scope === "categories") keys.push(REDIS_KEYS.categories);
  }
  await redisDel(...keys);
}

/** O(1) invalidation for cached booking slots (and optionally weekly availability rules). */
export async function invalidateAvailabilityCache(options?: { includeRules?: boolean }): Promise<void> {
  await Promise.all([
    redisBumpVersion(REDIS_KEYS.availabilityVersion),
    options?.includeRules ? redisDel(REDIS_KEYS.availabilityRules) : Promise.resolve(),
  ]);
}
