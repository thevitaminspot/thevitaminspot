"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { AccountButton } from "@/components/layout/account-button";
import { MobileAccountBar } from "@/components/layout/mobile-account-bar";
import { BrandWordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/brand";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

const links = [
  { href: "/shop", label: "Shop", description: "Vitamins & packs" },
  { href: "/infusions", label: "Infusions", description: "Book an IV drip" },
  { href: "/contact", label: "Contact", description: "Message the shop" },
];

function isCurrent(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNav({
  open,
  pathname,
  onClose,
  bagCount,
  onOpenBag,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
  bagCount: number;
  onOpenBag: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const animOut = leaving || !open;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className={`absolute inset-0 bg-ink/50 backdrop-blur-[3px] ${
          animOut ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
        aria-label="Close menu"
        onClick={onClose}
      />

      <nav
        className={`absolute top-0 right-0 flex h-full w-[min(100%,22rem)] flex-col border-l border-deep/10 bg-gradient-to-b from-white via-cream to-cream shadow-[-12px_0_40px_rgba(8,21,15,0.12)] ${
          animOut ? "animate-drawer-out" : "animate-drawer-in"
        }`}
        aria-label="Mobile"
      >
        <div className="relative flex min-h-[4.25rem] items-center justify-between border-b border-deep/8 px-5 py-4">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            aria-hidden
          />
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src={brand.mark.src}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
              aria-hidden
            />
            <BrandWordmark className="truncate text-[1.35rem] leading-none text-deep" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="nav-icon grid size-11 place-items-center rounded-full text-deep/70 hover:text-deep"
          >
            <X className="size-5" strokeWidth={1.35} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            <Link
              href="/shop#shop-search"
              onClick={onClose}
              className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl border border-deep/10 bg-white/80 px-3 text-[11px] font-medium tracking-[0.14em] text-deep uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-deep/20 hover:bg-white"
            >
              <Search className="size-4" strokeWidth={1.35} aria-hidden />
              Search
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBag();
              }}
              className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl border border-deep/10 bg-white/80 px-3 text-[11px] font-medium tracking-[0.14em] text-deep uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-deep/20 hover:bg-white"
            >
              <ShoppingBag className="size-4" strokeWidth={1.35} aria-hidden />
              Bag
              {bagCount > 0 ? (
                <span className="rounded-full bg-sage/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-deep">
                  {bagCount > 9 ? "9+" : bagCount}
                </span>
              ) : null}
            </button>
          </div>

          <ul className="space-y-2">
            {links.map((link, index) => {
              const current = isCurrent(link.href, pathname);
              return (
                <li
                  key={link.href}
                  className={animOut ? undefined : "animate-menu-item"}
                  style={animOut ? undefined : { animationDelay: `${80 + index * 55}ms` }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={current ? "page" : undefined}
                    className={`group flex flex-col rounded-2xl px-4 py-4 transition duration-200 ${
                      current
                        ? "bg-deep text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                        : "text-deep hover:bg-white/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                    }`}
                  >
                    <span className="text-[0.95rem] font-medium tracking-wide">{link.label}</span>
                    <span
                      className={`mt-1 text-xs transition ${
                        current ? "text-cream/80" : "text-deep/65 group-hover:text-deep/80"
                      }`}
                    >
                      {link.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-deep/8 bg-white/50 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          <MobileAccountBar onNavigate={onClose} />
        </div>
      </nav>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const openCart = useCartStore((state) => state.open);
  const isNavOpen = useUiStore((state) => state.isNavOpen);
  const openNav = useUiStore((state) => state.openNav);
  const closeNav = useUiStore((state) => state.closeNav);

  useEffect(() => {
    closeNav();
  }, [pathname, closeNav]);

  return (
    <>
      <header className="site-header sticky top-0 z-40">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3.5 py-3 sm:min-h-[3.75rem] sm:gap-3 sm:px-5 md:min-h-0 md:px-8 md:py-3.5">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 transition active:scale-[0.99] sm:gap-2.5 md:flex-none"
            onClick={closeNav}
          >
            <Image
              src={brand.mark.src}
              alt=""
              width={44}
              height={44}
              sizes="44px"
              className="size-9 shrink-0 object-contain sm:size-10 md:size-11"
              aria-hidden
            />
            <BrandWordmark className="min-w-0 truncate text-[1.05rem] leading-none tracking-[-0.03em] sm:text-[1.4rem] sm:tracking-[-0.02em] md:text-[1.65rem]" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => {
              const current = isCurrent(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={`relative px-3.5 py-2 text-[11px] tracking-[0.16em] uppercase transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep ${
                    current ? "font-medium text-deep" : "text-deep/70 hover:text-deep"
                  }`}
                >
                  {link.label}
                  {current ? (
                    <span
                      className="absolute inset-x-3.5 -bottom-0.5 h-px bg-deep/70"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href="/shop#shop-search"
              className="nav-icon grid size-10 place-items-center rounded-full text-deep focus-visible:outline focus-visible:outline-offset-4 sm:size-11"
              aria-label="Search packs"
              onClick={closeNav}
            >
              <Search className="size-[1.05rem] sm:size-[1.15rem]" strokeWidth={1.35} />
            </Link>
            <AccountButton className="text-deep" />
            <button
              type="button"
              onClick={() => {
                closeNav();
                openCart();
              }}
              className="nav-icon relative grid size-10 place-items-center rounded-full text-deep focus-visible:outline focus-visible:outline-offset-4 sm:size-11"
              aria-label={mounted && count > 0 ? `Open bag, ${count} items` : "Open bag"}
            >
              <ShoppingBag className="size-[1.05rem] sm:size-[1.15rem]" strokeWidth={1.35} />
              {mounted && count > 0 ? (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-sage px-1 text-[9px] font-semibold leading-none text-deep ring-2 ring-cream">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="nav-icon grid size-10 place-items-center rounded-full text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep sm:size-11 md:hidden"
              onClick={isNavOpen ? closeNav : openNav}
              aria-label={isNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isNavOpen}
            >
              {isNavOpen ? (
                <X className="size-[1.05rem] sm:size-[1.15rem]" strokeWidth={1.35} />
              ) : (
                <Menu className="size-[1.05rem] sm:size-[1.15rem]" strokeWidth={1.35} />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={isNavOpen}
        pathname={pathname}
        onClose={closeNav}
        bagCount={mounted ? count : 0}
        onOpenBag={openCart}
      />
    </>
  );
}
