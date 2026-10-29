"use client";

import Image from "next/image";
import Link from "next/link";
import { interactiveControl } from "@/components/ui/form-styles";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Droplets,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/layout/account-button";
import { BrandWordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/brand";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Today", exact: true, icon: LayoutDashboard }],
  },
  {
    label: "Shop",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/zones", label: "Delivery", icon: Truck },
    ],
  },
  {
    label: "Clinic",
    links: [
      { href: "/admin/appointments", label: "Bookings", icon: CalendarDays },
      { href: "/admin/infusions", label: "Infusions", icon: Droplets },
      { href: "/admin/availability", label: "Hours", icon: Clock3 },
    ],
  },
  {
    label: "Inbox",
    links: [{ href: "/admin/messages", label: "Messages", icon: Mail }],
  },
];

export const adminNavLinks = navGroups.flatMap((group) =>
  group.links.map((link) => ({ ...link, group: group.label })),
);

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-2">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] tracking-[0.22em] text-cream/35 uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = isActive(pathname, link.href, link.exact);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-cream/12 font-medium text-cream shadow-[inset_0_0_0_1px_rgba(244,239,228,0.12)]"
                        : "text-cream/60 hover:bg-cream/[0.06] hover:text-cream/90"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${
                        active ? "text-sage" : "text-cream/40 group-hover:text-cream/70"
                      }`}
                      aria-hidden
                    />
                    <span>{link.label}</span>
                    {active ? (
                      <span className="ml-auto size-1.5 rounded-full bg-sage" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ email }: { email?: string }) {
  return (
    <div className="mt-auto shrink-0 border-t border-cream/15 px-4 py-4">
      <div className="rounded-xl bg-cream/10 p-3.5 ring-1 ring-cream/20">
        <Link
          href="/shop"
          className="flex cursor-pointer items-center justify-between rounded-lg border border-cream/25 bg-cream/10 px-3 py-2.5 text-sm font-medium text-cream transition hover:bg-cream/20 hover:text-white"
        >
          View shop
          <span className="text-cream/80" aria-hidden>
            →
          </span>
        </Link>
        <Link
          href="/"
          className="mt-2 block px-1 py-2 text-[11px] tracking-[0.16em] text-cream/45 uppercase transition hover:text-cream"
        >
          Storefront
        </Link>

        <div className="mt-3.5 border-t border-cream/15 pt-3.5">
          <div className="flex items-center gap-3">
            <AccountButton
              className="text-sm font-medium text-cream hover:text-white"
              userButtonAppearance={{
                elements: {
                  userButtonAvatarBox: "size-8 ring-2 ring-cream/40",
                },
              }}
            />
          </div>
          {email ? (
            <p className="mt-2.5 truncate text-xs leading-5 text-cream/75">{email}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream/10 ring-1 ring-cream/15">
        <Image
          src={brand.mark.src}
          alt=""
          width={28}
          height={28}
          className="size-7 object-contain"
        />
      </span>
      <span className="min-w-0">
        <BrandWordmark className="block text-xl leading-tight text-cream" />
        <span className="mt-0.5 block text-[10px] tracking-[0.2em] text-cream/40 uppercase">Admin</span>
      </span>
    </Link>
  );
}

export function AdminSidebar({
  email,
  mobileOpen,
  onMobileClose,
}: {
  email?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="relative hidden md:sticky md:top-0 md:flex md:h-screen md:w-[17rem] md:shrink-0 md:flex-col md:border-r md:border-cream/10 md:bg-deep">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_0%_0%,rgba(139,165,117,0.18),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(207,225,175,0.08),transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex h-full min-h-0 flex-1 flex-col">
          <div className="shrink-0">
            <SidebarBrand />
          </div>
          <SidebarNav pathname={pathname} />
          <SidebarFooter email={email} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className={`absolute inset-0 bg-deep/60 backdrop-blur-[2px] ${interactiveControl}`}
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full min-h-0 w-[min(100%,18rem)] flex-col bg-deep shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-cream/10 pr-3">
              <SidebarBrand />
              <button
                type="button"
                aria-label="Close"
                onClick={onMobileClose}
                className={`rounded-lg p-2 text-cream/70 hover:bg-cream/10 hover:text-cream ${interactiveControl}`}
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={onMobileClose} />
            <SidebarFooter email={email} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function AdminMobileBar({
  onOpen,
  pageLabel,
  groupLabel,
}: {
  onOpen: () => void;
  pageLabel?: string;
  groupLabel?: string;
}) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-deep/8 bg-cream/95 px-4 py-3 backdrop-blur-md md:hidden">
      <button
        type="button"
        aria-label="Open admin menu"
        onClick={onOpen}
        className={`inline-flex items-center gap-2 rounded-lg border border-deep/10 bg-white px-3 py-2 text-sm text-deep ${interactiveControl}`}
      >
        <Menu className="size-4" aria-hidden />
        Menu
      </button>
      {pageLabel ? (
        <p className="truncate text-right text-[11px] tracking-[0.12em] text-deep/50 uppercase">
          {groupLabel ? `${groupLabel} · ` : null}
          {pageLabel}
        </p>
      ) : null}
    </div>
  );
}

export function useAdminMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return {
    open,
    openMenu: () => setOpen(true),
    closeMenu: () => setOpen(false),
  };
}

export function currentAdminPage(pathname: string) {
  const exact = adminNavLinks.find((link) => link.href === pathname);
  if (exact) return exact;
  return adminNavLinks.find((link) => pathname.startsWith(`${link.href}/`));
}
