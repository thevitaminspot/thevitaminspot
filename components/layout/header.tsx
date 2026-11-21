"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { AccountButton } from "@/components/layout/account-button";
import { MobileAccountBar } from "@/components/layout/mobile-account-bar";
import { BrandWordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/brand";
import { site, whatsappHref } from "@/lib/site";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

const links = [
  { href: "/shop", label: "Shop", description: "Daily vitamins & packs" },
  { href: "/infusions", label: "Infusions", description: "Nurse-led IV drips" },
  { href: "/contact", label: "Contact", description: "Visit or message us" },
];

function isCurrent(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNav({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  const onInfusionsPage = isCurrent("/infusions", pathname);

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        open ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
      role="dialog"
      aria-modal={open ? "true" : undefined}
      aria-hidden={!open}
      aria-label="Menu"
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[3px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close menu"
        onClick={onClose}
      />

      <nav
        className={`absolute top-0 right-0 flex h-full w-[min(100%,21.5rem)] flex-col border-l border-deep/10 bg-cream shadow-[-16px_0_44px_rgba(8,21,15,0.16)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile"
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-deep/10 bg-white/60 px-5 py-3.5">
          <Link
            href="/"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Image
              src={brand.mark.src}
              alt=""
              width={38}
              height={38}
              sizes="38px"
              className="size-9 shrink-0 object-contain"
              aria-hidden
            />
            <BrandWordmark className="truncate text-[1.4rem] leading-none text-deep" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            aria-label="Close menu"
            className="nav-icon grid size-10 shrink-0 place-items-center rounded-full text-deep/75 hover:text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-6 pb-5">
          <p className="text-[10px] font-medium tracking-[0.22em] text-deep/55 uppercase">
            Explore
          </p>

          <ul className="mt-3 divide-y divide-deep/10 border-y border-deep/10">
            {links.map((link, index) => {
              const current = isCurrent(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    tabIndex={open ? 0 : -1}
                    aria-current={current ? "page" : undefined}
                    className={`group flex items-center justify-between gap-3 py-4 transition ${
                      current ? "text-deep" : "text-deep/85 hover:text-deep"
                    }`}
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span
                        className={`font-sans text-[11px] tabular-nums ${
                          current ? "font-semibold text-deep" : "text-deep/45"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-display text-[1.6rem] leading-none tracking-[-0.02em]">
                            {link.label}
                          </span>
                          {current ? (
                            <span
                              className="size-1.5 rounded-full bg-deep"
                              aria-hidden
                            />
                          ) : null}
                        </span>
                        <span className="mt-1.5 block text-xs text-deep/65">
                          {link.description}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className={`size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                        current ? "text-deep" : "text-deep/40 group-hover:text-deep"
                      }`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <Link
              href={onInfusionsPage ? "/shop" : "/infusions"}
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] uppercase"
            >
              {onInfusionsPage ? "Shop vitamin packs" : "Book an IV drip"}
              <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Link>
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-2xl border border-deep/10 bg-white/70 px-4 py-3.5">
              <p className="text-[10px] font-medium tracking-[0.2em] text-deep/55 uppercase">
                Abuja Lounge
              </p>
              <p className="mt-1.5 flex items-start gap-2 text-xs leading-relaxed text-deep/80">
                <MapPin
                  className="mt-0.5 size-3.5 shrink-0 text-deep/55"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span>
                  Theodak Plaza, {site.address.area}, {site.address.city}
                </span>
              </p>
              <div className="mt-3 flex items-center gap-2 border-t border-deep/8 pt-3">
                <a
                  href={whatsappHref("Hi The Vitamin Spot, I'd like to ask about your packs or IV drips.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-deep/15 bg-cream/70 px-3 py-2 text-[11px] font-medium tracking-[0.12em] text-deep uppercase transition hover:border-deep/30 hover:bg-white"
                >
                  <MessageCircle className="size-3.5" strokeWidth={1.5} aria-hidden />
                  WhatsApp
                </a>
                <a
                  href={`tel:${site.phoneHref}`}
                  tabIndex={open ? 0 : -1}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-deep/15 bg-cream/70 px-3 py-2 text-[11px] font-medium tracking-[0.12em] text-deep uppercase transition hover:border-deep/30 hover:bg-white"
                >
                  <Phone className="size-3.5" strokeWidth={1.5} aria-hidden />
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-deep/10 bg-white/75 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          {open ? <MobileAccountBar onNavigate={onClose} /> : <div className="h-11" />}
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
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5 md:min-h-[4.5rem] md:px-8 md:py-3.5">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2.5 transition active:scale-[0.99] md:flex-none"
            onClick={closeNav}
          >
            <Image
              src={brand.mark.src}
              alt=""
              width={44}
              height={44}
              sizes="44px"
              className="size-10 shrink-0 object-contain md:size-11"
              aria-hidden
            />
            <BrandWordmark className="min-w-0 truncate text-[1.42rem] leading-none tracking-[-0.015em] text-deep sm:text-[1.55rem] md:text-[1.7rem]" />
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

          <div className="flex shrink-0 items-center gap-1 md:gap-0.5">
            <Link
              href="/shop#shop-search"
              className="nav-icon hidden size-11 place-items-center rounded-full text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep md:grid"
              aria-label="Search packs"
              onClick={closeNav}
            >
              <Search className="size-[1.15rem]" strokeWidth={1.35} />
            </Link>
            <div className="hidden md:block">
              <AccountButton className="text-deep" />
            </div>
            <button
              type="button"
              onClick={() => {
                closeNav();
                openCart();
              }}
              className="nav-icon relative grid size-10 place-items-center rounded-full text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep sm:size-11"
              aria-label={mounted && count > 0 ? `Open bag, ${count} items` : "Open bag"}
            >
              <ShoppingBag className="size-[1.15rem]" strokeWidth={1.45} />
              {mounted && count > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sage px-1 text-[9px] font-semibold leading-none text-deep ring-2 ring-cream">
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
                <X className="size-5" strokeWidth={1.5} />
              ) : (
                <Menu className="size-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={isNavOpen} pathname={pathname} onClose={closeNav} />
    </>
  );
}
