"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Today" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/infusions", label: "Infusions" },
  { href: "/admin/appointments", label: "Bookings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/availability", label: "Hours" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-deep/10 bg-white md:min-h-screen md:border-r md:border-b-0">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-2xl text-deep">
            The Vitamin Spot
          </Link>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-sage uppercase">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:pb-6">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-deep text-cream" : "text-deep/70 hover:bg-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/shop" className="shrink-0 rounded-lg px-3 py-2 text-sm text-deep/50 hover:bg-cream">
            View shop
          </Link>
        </nav>
      </aside>
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">{children}</div>
    </div>
  );
}
