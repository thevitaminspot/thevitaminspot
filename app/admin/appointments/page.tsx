import { listAdminAppointments } from "@/actions/admin";
import { AcceptAppointmentButton } from "@/components/admin/editors";
import { AppointmentStatusForm } from "@/components/admin/status-form";
import { getAdminUser } from "@/lib/admin";

export default async function AdminAppointmentsPage() {
  const admin = await getAdminUser();
  if (!admin) return <p>Sign in to see bookings.</p>;
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
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-deep/5 last:border-0">
                  <td className="px-4 py-3">{new Date(row.startsAt).toLocaleString("en-NG")}</td>
                  <td className="px-4 py-3">
                    {row.name}
                    <span className="mt-1 block text-deep/50">{row.email}</span>
                  </td>
                  <td className="px-4 py-3">{row.serviceName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AcceptAppointmentButton id={row.id} status={row.status} />
                      <AppointmentStatusForm id={row.id} status={row.status} />
                    </div>
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
