import Link from "next/link";
import { AdminOrderListItem } from "@/components/admin/order-list";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminQuickAction,
  AdminQuickActions,
  AdminSection,
  AdminStatCard,
} from "@/components/admin/ui";
import { DatabaseSetup, SeedCatalogueButton } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Admin" };

const lagos = "Africa/Lagos";

function when(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: lagos,
  }).format(value);
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: lagos,
  }).format(new Date());
}

export default async function AdminPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) {
    return (
      <div>
        <AdminPageHeader eyebrow="Overview" title="Today" />
        <DatabaseSetup />
      </div>
    );
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [orders, paid, depositRevenue, pendingBookings, soon, low, productCount] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: { in: ["PENDING", "PAID", "PACKED", "OUT_FOR_DELIVERY"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", purpose: "APPOINTMENT_DEPOSIT" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.findMany({
        where: { status: "CONFIRMED", startsAt: { gte: start } },
        include: { service: true, payment: true },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 6,
      }),
      prisma.product.count(),
    ]);

  const orderRevenue = paid._sum.total ?? 0;
  const infusionDeposits = depositRevenue._sum.amount ?? 0;
  const totalRevenue = orderRevenue + infusionDeposits;

  return (
    <div>
      <AdminPageHeader
        eyebrow={todayLabel()}
        title="Today"
        description={`${paid._count} paid orders · ${depositRevenue._count} infusion deposits · ${productCount} products live`}
      />

      {productCount === 0 ? (
        <AdminPanel className="mb-8 p-5">
          <p className="text-sm text-deep/70">The shop tables are empty.</p>
          <div className="mt-4">
            <SeedCatalogueButton />
          </div>
        </AdminPanel>
      ) : null}

      {pendingBookings > 0 ? (
        <AdminPanel className="mb-8 border-amber-200/70 bg-amber-50/50 px-5 py-4">
          <p className="text-sm text-amber-950/80">
            <strong>{pendingBookings}</strong> booking{pendingBookings === 1 ? "" : "s"} waiting
            for confirmation.
          </p>
        </AdminPanel>
      ) : null}

      <AdminQuickActions>
        <AdminQuickAction href="/admin/orders">Review orders</AdminQuickAction>
        <AdminQuickAction href="/admin/appointments">Manage bookings</AdminQuickAction>
        <AdminQuickAction href="/admin/products">Update stock</AdminQuickAction>
        <AdminQuickAction href="/admin/messages">Read messages</AdminQuickAction>
      </AdminQuickActions>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard href="/admin/orders" label="Open orders" value={String(orders.length)} />
        <AdminStatCard
          href="/admin/orders"
          label="Total revenue"
          value={formatNaira(totalRevenue)}
          hint={`${formatNaira(orderRevenue)} shop · ${formatNaira(infusionDeposits)} deposits`}
        />
        <AdminStatCard
          href="/admin/appointments"
          label="Bookings to accept"
          value={String(pendingBookings)}
        />
        <AdminStatCard
          href="/admin/products"
          label="Low stock alerts"
          value={String(low.length)}
        />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminSection title="Orders in progress" href="/admin/orders">
          <AdminPanel>
            <ul className="divide-y divide-deep/6">
              {orders.map((order) => (
                <li key={order.id}>
                  <AdminOrderListItem order={order} />
                </li>
              ))}
              {orders.length === 0 ? <AdminEmptyState>No open orders right now.</AdminEmptyState> : null}
            </ul>
          </AdminPanel>
        </AdminSection>

        <div className="space-y-8">
          <AdminSection title="Upcoming sessions" href="/admin/appointments">
            <AdminPanel>
              <ul className="divide-y divide-deep/6">
                {soon.map((row) => (
                  <li key={row.id} className="px-5 py-4">
                    <p className="font-medium text-deep">{row.service.name}</p>
                    <p className="mt-1 text-sm text-deep/55">
                      {row.name} · {when(row.startsAt)}
                    </p>
                    {row.payment?.status === "PAID" ? (
                      <p className="mt-2 text-[11px] tracking-[0.12em] text-sage uppercase">
                        Deposit paid
                      </p>
                    ) : null}
                  </li>
                ))}
                {soon.length === 0 ? (
                  <AdminEmptyState>No confirmed visits on the calendar.</AdminEmptyState>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          {low.length > 0 ? (
            <AdminSection title="Stock watch" href="/admin/products">
              <AdminPanel>
                <ul className="divide-y divide-deep/6">
                  {low.map((product) => (
                    <li key={product.id}>
                      <Link
                        href="/admin/products"
                        className="block px-5 py-3.5 text-sm text-deep/70 transition hover:bg-cream/30 hover:text-deep"
                      >
                        <span className="font-medium text-deep">
                          {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                        </span>
                        <span className="text-deep/45"> · {product.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </AdminPanel>
            </AdminSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}
