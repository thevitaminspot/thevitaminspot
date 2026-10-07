import { listAdminAppointments } from "@/actions/admin";
import { DatabaseSetup } from "@/components/admin/setup";
import { AppointmentStatusForm } from "@/components/admin/status-form";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminStatusBadge,
  AdminSummaryStrip,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Bookings" };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BookingTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof listAdminAppointments>>;
}) {
  if (rows.length === 0) {
    return <AdminEmptyState>Nothing here yet.</AdminEmptyState>;
  }

  return (
    <AdminTableWrap>
      <AdminTable>
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>When</AdminTableHeaderCell>
            <AdminTableHeaderCell>Guest</AdminTableHeaderCell>
            <AdminTableHeaderCell>Session</AdminTableHeaderCell>
            <AdminTableHeaderCell>Deposit</AdminTableHeaderCell>
            <AdminTableHeaderCell className="w-44">Status</AdminTableHeaderCell>
          </tr>
        </AdminTableHead>
        <tbody>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="whitespace-nowrap text-deep/80">{when(row.startsAt)}</AdminTableCell>
              <AdminTableCell>
                <span className="font-medium text-deep">{row.name}</span>
                <span className="mt-1 block text-deep/50">
                  {row.email}
                  {row.phone ? ` · ${row.phone}` : ""}
                </span>
              </AdminTableCell>
              <AdminTableCell>{row.serviceName}</AdminTableCell>
              <AdminTableCell>
                {row.depositPaid != null ? (
                  <span className="text-[11px] tracking-[0.12em] text-sage uppercase">Paid</span>
                ) : row.deposit > 0 ? (
                  <span className="text-deep/45">Due</span>
                ) : (
                  <span className="text-deep/35">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell>
                {row.status === "CANCELLED" || row.status === "COMPLETED" ? (
                  <AdminStatusBadge status={row.status} />
                ) : (
                  <AppointmentStatusForm
                    id={row.id}
                    status={row.status}
                    guestName={row.name}
                    serviceName={row.serviceName}
                    when={new Date(row.startsAt).toLocaleString("en-NG")}
                  />
                )}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTable>
    </AdminTableWrap>
  );
}

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

      {rows.length === 0 ? (
        <AdminEmptyState>No bookings yet.</AdminEmptyState>
      ) : (
        <div className="space-y-10">
          {needsAttention.length > 0 ? (
            <AdminSection title={`Needs attention · ${needsAttention.length}`}>
              <BookingTable rows={needsAttention} />
            </AdminSection>
          ) : null}

          {onCalendar.length > 0 ? (
            <AdminSection title={`Upcoming · ${onCalendar.length}`}>
              <BookingTable rows={onCalendar} />
            </AdminSection>
          ) : null}

          {needsAttention.length === 0 && onCalendar.length === 0 ? (
            <AdminPanel>
              <AdminEmptyState>No upcoming bookings. New requests will appear under “Needs attention”.</AdminEmptyState>
            </AdminPanel>
          ) : null}

          {archive.length > 0 ? (
            <AdminSection title={`Archive · ${archive.length}`}>
              <BookingTable rows={archive.slice(0, 20)} />
            </AdminSection>
          ) : null}
        </div>
      )}
    </div>
  );
}
