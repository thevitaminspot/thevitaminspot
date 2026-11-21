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
    take: 500,
    select: {
      id: true,
      orderNumber: true,
      name: true,
      email: true,
      phone: true,
      fulfillment: true,
      total: true,
      deliveryFee: true,
      status: true,
      notes: true,
      addressLine1: true,
      city: true,
      createdAt: true,
      payment: { select: { status: true } },
      deliveryZone: { select: { name: true } },
      items: { select: { name: true, quantity: true, unitPrice: true } },
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Orders"
        description="Paid orders move from confirmed, to packed, to on the way, then delivered."
      />

      <AdminOrders rows={rows} />
    </div>
  );
}
