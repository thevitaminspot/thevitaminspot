import { emailConfigStatus } from "@/lib/email";
import { resolveSiteUrl } from "@/lib/site";

export const runtime = "nodejs";

export async function GET() {
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
