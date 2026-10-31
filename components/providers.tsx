"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";
import { SiteToaster } from "@/components/ui/site-toaster";
import { siteClerkAppearance } from "@/lib/clerk-appearance";
import { useCartStore } from "@/stores/cart-store";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    (
      window as Window & { __stopStrippingCursorRefs?: () => void }
    ).__stopStrippingCursorRefs?.();
    void useCartStore.persist.rehydrate();
  }, []);

  const tree = (
    <>
      {children}
      <SiteToaster />
    </>
  );

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return tree;

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={siteClerkAppearance}
    >
      {tree}
    </ClerkProvider>
  );
}
