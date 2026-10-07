import { listAdminAppointments } from "@/actions/admin";
import { AdminBookingGroups } from "@/components/admin/booking-groups";
import { DatabaseSetup } from "@/components/admin/setup";
import { AdminPageHeader, AdminSummaryStrip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Bookings" };

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await listAdminAppointments();
  const now = Date.now();

  const needsAttention = rows.filter((row) => row.status === "PENDING");
  const onCalendar = rows.filter(
    (row) => row.status === "CONFIRMED" && new Date(row.startsAt).getTime() >= now,
  );
  const archive = rows.filter(
    (row) =>
      row.status === "CANCELLED" ||
      row.status === "COMPLETED" ||
      (row.status === "CONFIRMED" && new Date(row.startsAt).getTime() < now),
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Clinic"
        title="Bookings"
        description="Confirm new requests, manage upcoming sessions, and review past visits."
      />

      {rows.length > 0 ? (
        <AdminSummaryStrip
          items={[
            {
              label: "Needs attention",
              value: String(needsAttention.length),
              tone: needsAttention.length > 0 ? "attention" : "default",
            },
            { label: "Upcoming", value: String(onCalendar.length) },
            { label: "Archive", value: String(archive.length) },
            { label: "Total shown", value: String(rows.length) },
          ]}
        />
      ) : null}

      <AdminBookingGroups
        needsAttention={needsAttention}
        upcoming={onCalendar}
        archive={archive}
      />
    </div>
  );
}
