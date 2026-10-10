import { Suspense } from "react";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { CartDrawerLoader } from "@/components/shop/cart-drawer-loader";
import { getFeaturedFooterPacks } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const packs = await getFeaturedFooterPacks();

  return (
    <CookieConsentProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Suspense
        fallback={
          <header className="sticky top-0 z-40 border-b border-deep/10 bg-cream/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 md:px-8 md:py-3">
              <div className="size-10 shrink-0 md:size-11" aria-hidden />
              <div className="size-10 shrink-0" aria-hidden />
            </div>
          </header>
        }
      >
        <Header />
      </Suspense>
      <div className="page-enter">{children}</div>
      <Footer packs={packs} />
      <CartDrawerLoader />
    </CookieConsentProvider>
  );
}
