import { DatabaseSetup } from "@/components/admin/setup";
import { AdminOrderGroups } from "@/components/admin/order-list";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { groupAdminOrders } from "@/lib/admin-orders";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await prisma.order.findMany({
    where: { payment: { status: "PAID" } },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { payment: true, items: true },
  });

  const groups = groupAdminOrders(rows);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Orders"
        description="Grouped by what needs doing first. Times show how long ago each order was placed."
      />

      <AdminOrderGroups groups={groups} />
    </div>
  );
}
