import { Suspense } from "react";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { CartDrawerLoader } from "@/components/shop/cart-drawer-loader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Suspense
        fallback={
          <header className="sticky top-0 z-40 h-[var(--site-header-height)] border-b border-deep/10 bg-cream/95 backdrop-blur-md">
            <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
              <div className="size-10 shrink-0 md:size-11" aria-hidden />
              <div className="size-10 shrink-0" aria-hidden />
            </div>
          </header>
        }
      >
        <Header />
      </Suspense>
      <Suspense fallback={<div>{children}</div>}>
        <PageTransition>{children}</PageTransition>
      </Suspense>
      <Footer />
      <CartDrawerLoader />
    </CookieConsentProvider>
  );
}
