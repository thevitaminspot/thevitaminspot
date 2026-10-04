import { OrderStatusForm } from "@/components/admin/status-form";
import { getAdminUser } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export default async function AdminOrdersPage() {
  const admin = await getAdminUser();
  if (!admin) return <p>Sign in to see orders.</p>;
  const prisma = await tryPrisma();
  const rows = prisma
    ? await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
    : [];

  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      {!prisma ? (
        <p className="mt-4 text-sm text-deep/60">
          Orders show up here once the shop is connected to the database.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-deep/10 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-deep/10 text-[11px] tracking-[0.12em] text-deep/45 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-deep/5 last:border-0">
                  <td className="px-4 py-3">{row.orderNumber}</td>
                  <td className="px-4 py-3">{formatNaira(row.total)}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">
                    <OrderStatusForm id={row.id} status={row.status} />
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
