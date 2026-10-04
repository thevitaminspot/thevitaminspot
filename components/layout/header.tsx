"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { brand } from "@/lib/brand";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

const links = [
  { href: "/infusions", label: "Infusions" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const openCart = useCartStore((state) => state.open);
  const { isNavOpen, openNav, closeNav } = useUiStore();

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-deep/10 bg-cream">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-3" onClick={closeNav}>
            <Image
              src={brand.logo.src}
              alt={brand.logo.alt}
              width={36}
              height={47}
              className="h-11 w-auto object-contain"
              priority
            />
            <span className="font-display hidden text-xl tracking-[0.04em] sm:inline">
              The Vitamin Spot
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[12px] tracking-[0.12em] uppercase transition ${
                  pathname === link.href ? "text-sage" : "text-deep/70 hover:text-deep"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="hidden text-[11px] tracking-[0.2em] uppercase text-deep/60 md:inline"
            >
              Account
            </Link>
            <Link
              href="/infusions"
              className="hidden rounded-lg border border-deep/15 px-4 py-2 text-[12px] tracking-[0.1em] text-deep uppercase md:inline-flex"
            >
              Book
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-deep focus-visible:outline focus-visible:outline-offset-4"
              aria-label="Open cart"
            >
              <ShoppingBag className="size-5" />
              {count > 0 ? (
                <span className="absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-sage text-[10px] text-deep">
                  {count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="p-2 md:hidden"
              onClick={isNavOpen ? closeNav : openNav}
              aria-label={isNavOpen ? "Close menu" : "Open menu"}
            >
              {isNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {isNavOpen ? (
          <nav className="flex flex-col gap-4 px-5 pb-5 md:hidden" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeNav}
                className="text-sm tracking-[0.2em] uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/account" onClick={closeNav} className="text-sm tracking-[0.2em] uppercase">
              Account
            </Link>
          </nav>
        ) : null}
    </header>
  );
}
