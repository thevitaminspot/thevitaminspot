import { SystemHealthPanel } from "@/components/admin/system-health-panel";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { site } from "@/lib/site";

export const metadata = { title: "System" };
export const instant = false;

export default async function AdminSystemPage() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Setup"
        title="System"
        description="Confirm env, Neon, Clerk, Paystack, Resend, and Cloudinary — then run front + back smoke tests before going live."
      />

      <AdminPanel className="mb-8 p-5">
        <h2 className="font-display text-2xl text-deep">Checklist</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-deep/65">
          <li>
            Set Production env vars in Vercel (see{" "}
            <code className="text-xs text-deep">.env.example</code>).
          </li>
          <li>
            Verify thevitaminspotltd.com in Resend for sending, and keep{" "}
            <code className="text-xs text-deep">RESEND_FROM_EMAIL</code> on that domain.
          </li>
          <li>
            Keep <code className="text-xs text-deep">ADMIN_EMAIL</code> as the operator login
            that can open this admin (primary: {site.email}).
          </li>
          <li>
            Confirm Paystack keys for NGN checkout, then load the starter catalogue if the shop
            tables are empty.
          </li>
        </ol>
      </AdminPanel>

      <AdminPanel className="p-5">
        <h2 className="font-display text-2xl text-deep">Front + back tests</h2>
        <p className="mt-2 text-sm leading-6 text-deep/60">
          Frontend checks run in the browser. Backend checks hit Neon, shop tables, and required
          secrets.
        </p>
        <div className="mt-5">
          <SystemHealthPanel />
        </div>
      </AdminPanel>
    </div>
  );
}
