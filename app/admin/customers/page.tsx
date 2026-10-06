import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      email: true,
      name: true,
      phone: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  const people = new Map<
    string,
    { email: string; name: string; phone: string; orders: number; spent: number; last: Date }
  >();

  for (const order of orders) {
    const current = people.get(order.email) ?? {
      email: order.email,
      name: order.name,
      phone: order.phone,
      orders: 0,
      spent: 0,
      last: order.createdAt,
    };
    current.orders += 1;
    if (order.status !== "CANCELLED" && order.status !== "PENDING") current.spent += order.total;
    if (order.createdAt > current.last) current.last = order.createdAt;
    people.set(order.email, current);
  }

  const rows = [...people.values()].sort((a, b) => b.spent - a.spent);

  return (
    <div>
      <h1 className="font-display text-4xl">Customers</h1>
      <p className="mt-2 text-sm text-deep/60">People who have checked out. Spend excludes unpaid and cancelled orders.</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">No customers yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-deep/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-deep/10 text-[11px] tracking-[0.12em] text-deep/45 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Spent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email} className="border-b border-deep/5 last:border-0">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.email}
                    <span className="mt-1 block text-deep/50">{row.phone}</span>
                  </td>
                  <td className="px-4 py-3">{row.orders}</td>
                  <td className="px-4 py-3">{formatNaira(row.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
