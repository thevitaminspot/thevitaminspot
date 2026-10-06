import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/admin";
import { hasClerk } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasClerk()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20">
        <h1 className="font-display text-4xl">Admin is locked</h1>
        <p className="mt-4 leading-7 text-deep/70">
          Add Clerk keys, then set <code>ADMIN_EMAIL</code> to the address allowed into this room.
          You can also set a user&apos;s public metadata <code>role</code> to <code>admin</code> in
          Clerk.
        </p>
      </main>
    );
  }

  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
