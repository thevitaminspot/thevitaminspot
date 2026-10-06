import Link from "next/link";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { payment: true, items: true },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <p className="mt-2 text-sm text-deep/60">Open an order to pack it, send it, or cancel it.</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-deep/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-deep/10 text-[11px] tracking-[0.12em] text-deep/45 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-deep/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${row.id}`} className="font-medium underline">
                      {row.orderNumber}
                    </Link>
                    <span className="mt-1 block text-deep/45">{row.fulfillment}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.name}
                    <span className="mt-1 block text-deep/50">{row.email}</span>
                  </td>
                  <td className="px-4 py-3">{row.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-4 py-3">{formatNaira(row.total)}</td>
                  <td className="px-4 py-3">{row.payment?.status ?? "—"}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
