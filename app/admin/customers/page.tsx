import { AdminCustomerList } from "@/components/admin/customer-list";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Customers" };
export const instant = false;

type CustomerAggRow = {
  email: string;
  name: string;
  phone: string;
  orders: bigint;
  spent: bigint | null;
};

export default async function AdminCustomersPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const aggregated = await prisma.$queryRaw<CustomerAggRow[]>`
    SELECT
      LOWER(o."email") AS email,
      (ARRAY_AGG(o."name" ORDER BY o."createdAt" DESC))[1] AS name,
      (ARRAY_AGG(o."phone" ORDER BY o."createdAt" DESC))[1] AS phone,
      COUNT(*)::bigint AS orders,
      COALESCE(SUM(CASE WHEN o."status" <> 'CANCELLED' THEN o."total" ELSE 0 END), 0)::bigint AS spent
    FROM "Order" o
    INNER JOIN "Payment" p ON p."orderId" = o."id"
    WHERE p."status" = 'PAID'
    GROUP BY LOWER(o."email")
    ORDER BY spent DESC
    LIMIT 500
  `;

  const rows = aggregated.map((row) => ({
    email: row.email,
    name: row.name,
    phone: row.phone,
    orders: Number(row.orders),
    spent: Number(row.spent ?? 0),
  }));

  return <AdminCustomerList rows={rows} />;
}
