import { listAdminAppointments } from "@/actions/admin";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { AppointmentStatusForm } from "@/components/admin/status-form";
import { tryPrisma } from "@/lib/db";
export const metadata = { title: "Bookings" };

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;
  const rows = await listAdminAppointments();

  return (
    <div>
      <h1 className="font-display text-4xl">Bookings</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">No bookings yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-deep/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-deep/10 text-[11px] tracking-[0.12em] text-deep/45 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Deposit</th>
                <th className="w-40 px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-deep/5 last:border-0">
                  <td className="px-4 py-3">{new Date(row.startsAt).toLocaleString("en-NG")}</td>
                  <td className="px-4 py-3">
                    {row.name}
                    <span className="mt-1 block text-deep/50">
                      {row.email}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.serviceName}</td>
                  <td className="px-4 py-3 text-deep/70">
                    {row.depositPaid != null ? "Deposit paid" : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <AppointmentStatusForm id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
