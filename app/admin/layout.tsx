import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { DynamicMarker } from "@/components/ui/dynamic-marker";
import { pageAuth, pageShell } from "@/components/ui/layout-styles";
import { requireAdmin } from "@/lib/admin";
import { hasClerk } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasClerk()) {
    return (
      <main className={`${pageAuth} ${pageShell}`}>
        <h1 className="font-display text-4xl">Admin is locked</h1>
        <p className="mt-4 leading-7 text-deep/70">
          Add Clerk keys, then set <code>ADMIN_EMAIL</code> to the address allowed into this room.
          You can also set a user&apos;s public metadata <code>role</code> to <code>admin</code> in
          Clerk.
        </p>
      </main>
    );
  }

  return (
    <>
      <DynamicMarker />
      {/* Show the shell chrome immediately — no loading theatre on client → admin. */}
      <Suspense fallback={<AdminShell />}>
        <AuthedAdminShell>{children}</AuthedAdminShell>
      </Suspense>
    </>
  );
}

async function AuthedAdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
