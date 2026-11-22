import "server-only";
import { REDIS_KEYS, redisGet, redisSet } from "@/lib/redis";

export type SiteTraffic =
  | {
      status: "ready";
      visitors: number;
      pageviews: number;
      todayVisitors: number;
    }
  | { status: "unconfigured" }
  | { status: "error" };

type CountPayload = {
  data?: {
    pageviews?: number;
    visitors?: number;
  };
};

function analyticsConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId };
}

async function countVisits(since: Date, until: Date) {
  const config = analyticsConfig();
  if (!config) return null;

  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", config.projectId);
  url.searchParams.set("since", since.toISOString());
  url.searchParams.set("until", until.toISOString());
  if (config.teamId) url.searchParams.set("teamId", config.teamId);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.token}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    console.error("[analytics] visits/count failed", response.status);
    return null;
  }

  const payload = (await response.json()) as CountPayload;
  return {
    visitors: payload.data?.visitors ?? 0,
    pageviews: payload.data?.pageviews ?? 0,
  };
}

export async function getSiteTraffic(): Promise<SiteTraffic> {
  if (!analyticsConfig()) return { status: "unconfigured" };

  const cached = await redisGet<Extract<SiteTraffic, { status: "ready" }>>(REDIS_KEYS.siteTraffic);
  if (cached) return cached;

  // Round to a 5-minute boundary so identical URLs hit Next's 300s fetch cache.
  const bucketMs = 5 * 60 * 1000;
  const until = new Date(Math.floor(Date.now() / bucketMs) * bucketMs);
  const week = new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()));

  try {
    const [weekCount, todayCount] = await Promise.all([
      countVisits(week, until),
      countVisits(today, until),
    ]);
    if (!weekCount || !todayCount) return { status: "error" };
    const result: Extract<SiteTraffic, { status: "ready" }> = {
      status: "ready",
      visitors: weekCount.visitors,
      pageviews: weekCount.pageviews,
      todayVisitors: todayCount.visitors,
    };
    await redisSet(REDIS_KEYS.siteTraffic, result, 300);
    return result;
  } catch (error) {
    console.error("[analytics]", error);
    return { status: "error" };
  }
}
