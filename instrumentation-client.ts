import * as Sentry from "@sentry/nextjs";
import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/checkout", method: "POST" },
    { path: "/infusions", method: "POST" },
    { path: "/contact", method: "POST" },
    { path: "/", method: "POST" },
    { path: "/orders/*", method: "POST" },
    { path: "/appointments/*", method: "POST" },
  ],
});

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
