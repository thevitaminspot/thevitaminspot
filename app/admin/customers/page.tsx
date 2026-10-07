import { AdminCustomerList } from "@/components/admin/customer-list";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Customers" };
export const instant = false;

export default async function AdminCustomersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const orders = await prisma.order.findMany({
    where: { payment: { status: "PAID" } },
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
    if (order.status !== "CANCELLED") current.spent += order.total;
    if (order.createdAt > current.last) current.last = order.createdAt;
    people.set(order.email, current);
  }

  const rows = [...people.values()]
    .sort((a, b) => b.spent - a.spent)
    .map(({ email, name, phone, orders, spent }) => ({ email, name, phone, orders, spent }));

  return <AdminCustomerList rows={rows} />;
}
