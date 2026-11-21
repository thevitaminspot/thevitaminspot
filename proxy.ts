import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

type ProxyHandler = (
  req: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response>;

const isAdminPage = createRouteMatcher(["/admin(.*)"]);
const isAdminApi = createRouteMatcher(["/api/admin(.*)"]);

let clerkHandler: ProxyHandler | null = null;

function getClerkHandler(): ProxyHandler {
  if (!clerkHandler) {
    // Defense-in-depth at the proxy layer; pages, actions, and API routes still enforce admin role.
    clerkHandler = clerkMiddleware(async (auth, req) => {
      if (isAdminApi(req)) {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }
        return;
      }
      if (isAdminPage(req)) {
        await auth.protect();
      }
    }) as ProxyHandler;
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
