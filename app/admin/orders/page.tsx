import { AdminOrders } from "@/components/admin/order-list";
import { DatabaseSetup } from "@/components/admin/setup";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Orders" };
export const instant = false;

export default async function AdminOrdersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await prisma.order.findMany({
    where: { payment: { status: "PAID" } },
    orderBy: { createdAt: "desc" },
    include: { payment: true, items: true },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Orders"
        description="Paid orders only. Open covers anything still being packed or delivered."
      />

      <AdminOrders rows={rows} />
    </div>
  );
}
