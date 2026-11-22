import { createHash, timingSafeEqual } from "node:crypto";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { hasRedis, tryRedis } from "@/lib/redis";

function safeTokenMatch(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const a = createHash("sha256").update(actual).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = await rateLimit(`health-redis:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  // Only expose Redis status and latency when a shared probe token is present.
  const probe = request.headers.get("x-health-token");
  const expected = process.env.HEALTH_PROBE_TOKEN;
  if (!safeTokenMatch(probe, expected)) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const configured = hasRedis();
  const redis = tryRedis();
  if (!configured || !redis) {
    return Response.json({
      ok: false,
      configured: false,
      hint: "Run `npx vercel install upstash` or set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    });
  }

  const startedAt = Date.now();
  try {
    const pong = await redis.ping();
    return Response.json({
      ok: pong === "PONG",
      configured: true,
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        configured: true,
        latencyMs: Date.now() - startedAt,
        hint: "Upstash Redis ping failed. Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      },
      { status: 503 },
    );
  }
}
