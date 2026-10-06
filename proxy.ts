import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPaystackWebhook = createRouteMatcher(["/api/paystack/webhook"]);

const clerk = clerkMiddleware(async (auth, request) => {
  if (isPaystackWebhook(request)) return;
  if (isAdminRoute(request)) {
    await auth.protect({ unauthenticatedUrl: new URL("/login", request.url).href });
  }
});

export function proxy(request: NextRequest, event: Parameters<typeof clerk>[1]) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  return clerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
