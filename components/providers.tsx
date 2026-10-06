"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart-store";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    (
      window as Window & { __stopStrippingCursorRefs?: () => void }
    ).__stopStrippingCursorRefs?.();
    void useCartStore.persist.rehydrate();
  }, []);

  const app = <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return app;

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#0b2c21",
          borderRadius: "0.875rem",
        },
      }}
    >
      {app}
    </ClerkProvider>
  );
}
