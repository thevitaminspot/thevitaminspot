import { createHash, timingSafeEqual } from "node:crypto";
import { emailConfigStatus } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveSiteUrl } from "@/lib/site";

function safeTokenMatch(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const a = createHash("sha256").update(actual).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = await rateLimit(`health-email:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  // Only expose config status when a shared probe token is present.
  const probe = request.headers.get("x-health-token");
  const expected = process.env.HEALTH_PROBE_TOKEN;
  if (!safeTokenMatch(probe, expected)) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const email = emailConfigStatus();
  return Response.json({
    ok: email.configured,
    resendConfigured: email.configured,
    from: email.from,
    siteUrl: resolveSiteUrl(),
    vercelEnv: email.vercelEnv,
    hint: email.configured
      ? "Resend API key is present on this deployment."
      : "Set RESEND_API_KEY on Vercel Production (Settings → Environment Variables).",
  });
}
