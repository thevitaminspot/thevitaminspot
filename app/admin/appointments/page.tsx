import { listAdminAppointments } from "@/actions/admin";
import { AdminBookings } from "@/components/admin/bookings";
import { DatabaseSetup } from "@/components/admin/setup";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Bookings" };
export const instant = false;

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await listAdminAppointments();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Clinic"
        title="Bookings"
        description="Confirm requests, then mark each visit complete after it happens."
      />

      <AdminBookings rows={rows} />
    </div>
  );
}
