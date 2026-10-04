import Link from "next/link";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user?.email) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-5xl">Account</h1>
        <p className="mt-4 text-deep/70">
          Sign in to see your orders and bookings. You can still shop and book without one.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-lg bg-deep px-6 py-3 text-[11px] tracking-[0.18em] text-cream uppercase"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const prisma = await tryPrisma();
  const orders = prisma
    ? await prisma.order.findMany({
        where: { email: user.email },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];
  const appointments = prisma
    ? await prisma.appointment.findMany({
        where: { email: user.email },
        include: { service: true },
        orderBy: { startsAt: "desc" },
        take: 8,
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-5xl">Hello, {user.email}</h1>
      <section className="mt-12">
        <h2 className="text-[11px] tracking-[0.24em] uppercase">Orders</h2>
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.accessToken}`} className="flex justify-between">
                <span>{order.orderNumber}</span>
                <span>
                  {order.status} · {formatNaira(order.total)}
                </span>
              </Link>
            </li>
          ))}
          {orders.length === 0 ? <li className="text-deep/50">No orders yet.</li> : null}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className="text-[11px] tracking-[0.24em] uppercase">Bookings</h2>
        <ul className="mt-4 space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <Link href={`/appointments/${appointment.accessToken}`}>
                {appointment.service.name} · {appointment.startsAt.toLocaleString("en-NG")}
              </Link>
            </li>
          ))}
          {appointments.length === 0 ? <li className="text-deep/50">No bookings yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
