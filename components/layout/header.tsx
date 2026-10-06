"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { AccountButton } from "@/components/layout/account-button";
import { brand } from "@/lib/brand";
import { site } from "@/lib/site";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

const links = [
  { href: "/shop", label: "Shop", description: "Vitamins & packs" },
  { href: "/infusions", label: "Infusions", description: "Book an IV drip" },
  { href: "/contact", label: "Contact", description: "Message the shop" },
  { href: "/about", label: "About", description: "Our story" },
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />

      <nav
        className="absolute top-0 right-0 flex h-full w-full max-w-xs flex-col bg-cream shadow-2xl"
        aria-label="Mobile"
      >
        <div className="flex items-center justify-between border-b border-deep/10 px-5 py-4">
          <Image
            src={brand.mark.src}
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
            aria-hidden
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-full text-deep/70 transition hover:bg-deep/10 hover:text-deep"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Link
            href="/infusions"
            onClick={onClose}
            className="mb-5 flex items-center justify-center rounded-xl bg-deep py-3.5 text-[11px] font-medium tracking-[0.16em] text-cream uppercase transition hover:bg-[#14382a]"
          >
            Book an IV drip
          </Link>

          <ul className="space-y-1">
            {links.map((link) => {
              const current = isCurrent(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={current ? "page" : undefined}
                    className={`flex flex-col rounded-xl px-4 py-3.5 transition ${
                      current ? "bg-deep text-cream" : "text-deep hover:bg-deep/5"
                    }`}
                  >
                    <span className="text-sm font-medium tracking-wide">{link.label}</span>
                    <span
                      className={`mt-0.5 text-xs ${current ? "text-cream/70" : "text-deep/50"}`}
                    >
                      {link.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-deep/10 px-5 py-4">
          <AccountButton
            className="flex w-full items-center justify-center rounded-xl border border-deep/15 py-3 text-sm font-medium tracking-wide text-deep transition hover:bg-deep/5"
            onNavigate={onClose}
          />
        </div>
      </nav>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const openCart = useCartStore((state) => state.open);
  const { isNavOpen, openNav, closeNav } = useUiStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeNav();
  }, [pathname, closeNav]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-deep/10 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 md:px-8 md:py-3">
          <Link href="/" className="flex min-w-0 items-center" onClick={closeNav} aria-label={site.name}>
            <Image
              src={brand.mark.src}
              alt={brand.mark.alt}
              width={44}
              height={44}
              className="size-10 object-contain md:size-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {links.slice(0, 3).map((link) => {
              const current = isCurrent(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={`text-[12px] tracking-[0.12em] uppercase ${
                    current
                      ? "font-medium text-deep underline decoration-2 underline-offset-[10px]"
                      : "text-deep/55 hover:text-deep"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <AccountButton className="hidden text-[11px] tracking-[0.2em] text-deep/60 uppercase md:inline" />
            <Link
              href="/infusions"
              className="hidden rounded-lg border border-deep/15 px-4 py-2 text-[12px] tracking-[0.1em] text-deep uppercase transition hover:bg-deep/5 md:inline-flex"
            >
              Book
            </Link>
            <button
              type="button"
              onClick={() => {
                closeNav();
                openCart();
              }}
              className="relative grid size-10 place-items-center rounded-full text-deep transition hover:bg-deep/10 focus-visible:outline focus-visible:outline-offset-4"
              aria-label={mounted && count > 0 ? `Open cart, ${count} items` : "Open cart"}
            >
              <ShoppingBag className="size-5" />
              {mounted && count > 0 ? (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-sage px-1 text-[10px] font-semibold leading-none text-deep">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-deep transition hover:bg-deep/10 md:hidden"
              onClick={isNavOpen ? closeNav : openNav}
              aria-label={isNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isNavOpen}
            >
              {isNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={isNavOpen} pathname={pathname} onClose={closeNav} />
    </>
  );
}
