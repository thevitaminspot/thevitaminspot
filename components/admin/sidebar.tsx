"use client";

import Image from "next/image";
import Link from "next/link";
import { interactiveControl } from "@/components/ui/form-styles";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Droplets,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  Settings2,
  ShoppingBag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type ComponentType } from "react";
import { BrandWordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/brand";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: ComponentType<{ className?: string }>;
  group: string;
};

/** Daily work — always visible. */
const primaryLinks: NavLink[] = [
  { href: "/admin", label: "Today", exact: true, icon: LayoutDashboard, group: "Overview" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, group: "Shop" },
  { href: "/admin/appointments", label: "Bookings", icon: CalendarDays, group: "Clinic" },
  { href: "/admin/customers", label: "Customers", icon: Users, group: "Shop" },
  { href: "/admin/products", label: "Products", icon: Package, group: "Shop" },
  { href: "/admin/messages", label: "Messages", icon: Mail, group: "Inbox" },
];

/** Infrequent setup — tucked behind Settings. */
const settingsLinks: NavLink[] = [
  { href: "/admin/infusions", label: "Infusions", icon: Droplets, group: "Settings" },
  { href: "/admin/availability", label: "Hours", icon: Clock3, group: "Settings" },
  { href: "/admin/zones", label: "Delivery", icon: Truck, group: "Settings" },
  { href: "/admin/system", label: "System", icon: Settings2, group: "Settings" },
];

export const adminNavLinks = [...primaryLinks, ...settingsLinks];

const SETTINGS_OPEN_KEY = "tvs-admin-settings-open";
const settingsOpenListeners = new Set<() => void>();

function subscribeSettingsOpen(onStoreChange: () => void) {
  settingsOpenListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_OPEN_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    settingsOpenListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readSettingsOpen() {
  try {
    return window.localStorage.getItem(SETTINGS_OPEN_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeSettingsOpen(open: boolean) {
  try {
    window.localStorage.setItem(SETTINGS_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
  settingsOpenListeners.forEach((listener) => listener());
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function settingsRouteActive(pathname: string) {
  return settingsLinks.some((link) => isActive(pathname, link.href, link.exact));
}

function NavItem({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLink;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, link.href, link.exact);
  const Icon = link.icon;
  return (
    <li>
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
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const onSettings = settingsRouteActive(pathname);
  const storedOpen = useSyncExternalStore(subscribeSettingsOpen, readSettingsOpen, () => true);
  const settingsOpen = onSettings || storedOpen;

  function toggleSettings() {
    if (onSettings) return;
    writeSettingsOpen(!storedOpen);
  }

  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-2">
      <ul className="space-y-0.5">
        {primaryLinks.map((link) => (
          <NavItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </ul>

      <div>
        <button
          type="button"
          onClick={toggleSettings}
          aria-expanded={settingsOpen}
          className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-[10px] tracking-[0.22em] text-cream/35 uppercase transition hover:text-cream/60 ${interactiveControl}`}
        >
          Settings
          <ChevronDown
            className={`size-3.5 transition ${settingsOpen ? "rotate-0" : "-rotate-90"}`}
            aria-hidden
          />
        </button>
        {settingsOpen ? (
          <ul className="mt-0.5 space-y-0.5">
            {settingsLinks.map((link) => (
              <NavItem
                key={link.href}
                link={link}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </nav>
  );
}

function SidebarFooter({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const helpActive = isActive(pathname, "/admin/help");
  return (
    <div className="mt-auto shrink-0 space-y-2 border-t border-cream/15 px-4 py-4">
      <Link
        href="/admin/help"
        onClick={onNavigate}
        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
          helpActive
            ? "bg-cream/12 font-medium text-cream"
            : "border border-cream/20 text-cream/80 hover:border-cream/40 hover:text-cream"
        }`}
      >
        <CircleHelp className="size-4 shrink-0" aria-hidden />
        Help & guide
      </Link>
      <Link
        href="/shop"
        onClick={onNavigate}
        className="flex cursor-pointer items-center justify-between rounded-xl border border-cream/20 px-3 py-2.5 text-sm text-cream/80 transition hover:border-cream/40 hover:text-cream"
      >
        View shop
        <span aria-hidden>→</span>
      </Link>
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
        <span className="mt-0.5 block text-[10px] tracking-[0.2em] text-cream/40 uppercase">
          Admin
        </span>
      </span>
    </Link>
  );
}

export function AdminSidebar({
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
          <SidebarFooter pathname={pathname} />
        </div>
      </aside>

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
            <SidebarFooter pathname={pathname} onNavigate={onMobileClose} />
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
    <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-deep/8 bg-cream/95 px-4 py-3 backdrop-blur-md md:hidden">
      <button
        type="button"
        aria-label="Open admin menu"
        onClick={onOpen}
        className={`inline-flex items-center gap-2 rounded-lg border border-deep/10 bg-white px-3 py-2 text-sm text-deep ${interactiveControl}`}
      >
        <Menu className="size-4" aria-hidden />
        Menu
      </button>
      <div className="min-w-0 flex-1 truncate text-right text-[11px] tracking-[0.12em] text-deep/50 uppercase">
        {pageLabel ? (
          <>
            {groupLabel ? `${groupLabel} · ` : null}
            {pageLabel}
          </>
        ) : null}
      </div>
      <Link
        href="/admin/help"
        className="shrink-0 rounded-lg border border-deep/10 bg-white px-3 py-2 text-[11px] tracking-[0.12em] text-deep/70 uppercase"
      >
        Help
      </Link>
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

const helpPage: NavLink = {
  href: "/admin/help",
  label: "Help",
  exact: true,
  icon: CircleHelp,
  group: "Guide",
};

export function currentAdminPage(pathname: string) {
  if (isActive(pathname, helpPage.href, true)) return helpPage;
  const exact = adminNavLinks.find((link) => link.href === pathname);
  if (exact) return exact;
  return adminNavLinks.find((link) => pathname.startsWith(`${link.href}/`));
}
