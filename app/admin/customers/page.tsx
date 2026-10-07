import { DatabaseSetup } from "@/components/admin/setup";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
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
      <AdminPageHeader
        eyebrow="Shop"
        title="Customers"
        description="People who have checked out. Spend excludes unpaid and cancelled orders."
      />
      {rows.length === 0 ? (
        <AdminEmptyState>No customers yet.</AdminEmptyState>
      ) : (
        <AdminTableWrap>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Name</AdminTableHeaderCell>
                <AdminTableHeaderCell>Contact</AdminTableHeaderCell>
                <AdminTableHeaderCell>Orders</AdminTableHeaderCell>
                <AdminTableHeaderCell>Spent</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {rows.map((row) => (
                <AdminTableRow key={row.email}>
                  <AdminTableCell className="font-medium text-deep">{row.name}</AdminTableCell>
                  <AdminTableCell>
                    {row.email}
                    <span className="mt-1 block text-deep/50">{row.phone}</span>
                  </AdminTableCell>
                  <AdminTableCell>{row.orders}</AdminTableCell>
                  <AdminTableCell className="font-medium">{formatNaira(row.spent)}</AdminTableCell>
                </AdminTableRow>
              ))}
            </tbody>
          </AdminTable>
        </AdminTableWrap>
      )}
    </div>
  );
}
