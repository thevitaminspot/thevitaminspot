"use client";

import type { ReactNode } from "react";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";

/**
 * Clerk <SignIn>/<SignUp> inject a host node on the client that does not match
 * SSR markup. Mount only after hydration to avoid mismatch / blank forms.
 */
export function ClerkAuthMount({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const mounted = useClientMounted();
  if (!mounted) return fallback;
  return children;
}
