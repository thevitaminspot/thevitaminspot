"use client";

import Image from "next/image";
import Link from "next/link";
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
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/layout/account-button";
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
      { href: "/admin/customers", label: "Customers", icon: Users },
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
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
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
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
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
    <div className="border-t border-cream/10 px-5 py-5">
      <Link
        href="/shop"
        className="inline-flex text-[11px] tracking-[0.14em] text-cream/45 uppercase transition hover:text-cream"
      >
        View shop →
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <AccountButton />
        {email ? (
          <span className="min-w-0 truncate text-xs text-cream/40">{email}</span>
        ) : null}
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
        <span className="block font-display text-lg leading-tight text-cream">The Vitamin Spot</span>
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
      <aside className="relative hidden md:flex md:min-h-screen md:w-[17rem] md:shrink-0 md:flex-col md:border-r md:border-cream/10 md:bg-deep">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_0%_0%,rgba(139,165,117,0.18),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(207,225,175,0.08),transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex min-h-screen flex-1 flex-col">
          <SidebarBrand />
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
            className="absolute inset-0 bg-deep/60 backdrop-blur-[2px]"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-[min(100%,18rem)] flex-col bg-deep shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream/10 pr-3">
              <SidebarBrand />
              <button
                type="button"
                aria-label="Close"
                onClick={onMobileClose}
                className="rounded-lg p-2 text-cream/70 hover:bg-cream/10 hover:text-cream"
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
        className="inline-flex items-center gap-2 rounded-lg border border-deep/10 bg-white px-3 py-2 text-sm text-deep"
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
