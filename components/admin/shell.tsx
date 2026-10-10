"use client";

import { usePathname } from "next/navigation";
import {
  AdminMobileBar,
  AdminSidebar,
  currentAdminPage,
  useAdminMobileNav,
} from "@/components/admin/sidebar";

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  const pathname = usePathname();
  const mobile = useAdminMobileNav();
  const page = currentAdminPage(pathname);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ef_0%,#f4efe4_100%)] md:flex">
      <AdminSidebar
        email={email}
        mobileOpen={mobile.open}
        onMobileClose={mobile.closeMenu}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar
          onOpen={mobile.openMenu}
          groupLabel={page?.group}
          pageLabel={page?.label}
        />

        {page ? (
          <div className="hidden border-b border-deep/6 bg-white/60 px-10 py-3.5 backdrop-blur-sm md:block">
            <p className="text-[10px] tracking-[0.18em] text-deep/40 uppercase">
              {page.group}
              <span className="mx-2 text-deep/20">/</span>
              <span className="text-deep/65">{page.label}</span>
            </p>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
