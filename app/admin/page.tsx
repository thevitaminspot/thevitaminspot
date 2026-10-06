import Link from "next/link";
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

export default async function AdminPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) {
    return (
      <div>
        <h1 className="font-display text-5xl text-deep">Today</h1>
        <div className="mt-6">
          <DatabaseSetup />
        </div>
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

  const cards = [
    { href: "/admin/orders", label: "Open orders", note: String(orders.length) },
    {
      href: "/admin/orders",
      label: "Total revenue",
      note: formatNaira(totalRevenue),
    },
    { href: "/admin/appointments", label: "To accept", note: String(pendingBookings) },
    { href: "/admin/products", label: "Low stock", note: String(low.length) },
  ];

  return (
    <div>
      <h1 className="font-display text-5xl text-deep">Today</h1>
      <p className="mt-3 text-sm text-deep/60">
        {paid._count} paid orders · {depositRevenue._count} infusion deposits (
        {formatNaira(infusionDeposits)}) · {productCount} products in Neon
      </p>
      {productCount === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-deep/70">The shop tables are empty.</p>
          <SeedCatalogueButton />
        </div>
      ) : null}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link href={card.href} className="panel block bg-white px-4 py-4 hover:border-sage">
              <span className="block text-[11px] tracking-[0.12em] text-sage uppercase">{card.label}</span>
              <span className="mt-2 block font-display text-3xl text-deep">{card.note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[11px] tracking-[0.16em] text-sage uppercase">Orders</h2>
          <ul className="mt-3 divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-cream">
                  <span>
                    <span className="block font-medium">{order.orderNumber}</span>
                    <span className="text-sm text-deep/55">{order.name}</span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block">{order.status}</span>
                    <span className="text-deep/55">{formatNaira(order.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
            {orders.length === 0 ? <li className="px-4 py-4 text-sm text-deep/60">No open orders.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="text-[11px] tracking-[0.16em] text-sage uppercase">Coming in</h2>
          <ul className="mt-3 divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white">
            {soon.map((row) => (
              <li key={row.id} className="px-4 py-3">
                <p className="font-medium">{row.service.name}</p>
                <p className="text-sm text-deep/55">
                  {row.name} · {when(row.startsAt)}
                  {row.payment?.status === "PAID" ? " · Deposit paid" : ""}
                </p>
              </li>
            ))}
            {soon.length === 0 ? <li className="px-4 py-4 text-sm text-deep/60">No confirmed visits.</li> : null}
          </ul>
          {low.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {low.map((product) => (
                <li key={product.id}>
                  <Link href="/admin/products" className="text-deep/70 hover:text-deep">
                    {product.stock === 0 ? "Out" : `${product.stock} left`} · {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
