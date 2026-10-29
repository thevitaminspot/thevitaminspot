import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

type ProxyHandler = (
  req: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response>;

let clerkHandler: ProxyHandler | null = null;

function getClerkHandler(): ProxyHandler {
  if (!clerkHandler) {
    // Bare middleware — route protection lives in layouts/pages/actions.
    clerkHandler = clerkMiddleware() as ProxyHandler;
  }
  return clerkHandler;
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  return getClerkHandler()(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
