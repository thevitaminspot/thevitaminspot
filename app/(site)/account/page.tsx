import Link from "next/link";
import { AccountPaginationBars } from "@/components/account/account-pagination";
import { AccountStatusBadge } from "@/components/account/account-status-badge";
import { getSessionProfile } from "@/lib/auth";
import { formatLagos } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";
import { hasClerk } from "@/lib/env";
import { formatNaira } from "@/lib/money";
import { PAGE_SIZE, clampPage, parsePageParam, totalPages } from "@/lib/pagination";
import { formButtonSecondary, formSubmitInline } from "@/components/ui/form-styles";
import { pageAuth, pageShell, pageWide, surface } from "@/components/ui/layout-styles";

export const metadata = { title: "Account", robots: { index: false, follow: false } };
export const instant = false;

const orderWhere = (email: string) => ({
  email,
  payment: { status: "PAID" as const },
});

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ordersPage?: string; bookingsPage?: string }>;
}) {
  if (!hasClerk()) {
    return (
      <main className={`${pageAuth} ${pageShell} text-center`}>
        <h1 className="font-display text-5xl">Account</h1>
        <p className="mt-4 text-deep/70">
          Sign-in uses Clerk. Add the keys, then your orders and bookings will collect here. Guest
          checkout still works.
        </p>
      </main>
    );
  }

  const profile = await getSessionProfile();
  if (!profile) {
    return (
      <main className={`${pageAuth} ${pageShell} text-center`}>
        <h1 className="font-display text-4xl text-deep">Your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep/70">
          Sign in to see your orders and drip bookings.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className={formSubmitInline}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={formButtonSecondary}
          >
            Create account
          </Link>
        </div>
        <div className="mt-12 rounded-2xl border border-deep/10 bg-white/60 p-4 text-xs text-deep/65">
          <p className="font-medium text-deep">Checking out or booking as a guest?</p>
          <p className="mt-1">You don&apos;t need an account to buy a pack or book a drip.</p>
          <div className="mt-3 flex items-center justify-center gap-3 font-medium text-deep">
            <Link href="/shop" className="underline hover:text-sage">
              See the packs
            </Link>
            <span className="text-deep/30">·</span>
            <Link href="/infusions" className="underline hover:text-sage">
              Book a drip
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const ordersPageRaw = parsePageParam(params.ordersPage);
  const bookingsPageRaw = parsePageParam(params.bookingsPage);

  const prisma = await tryPrisma();
  const empty = { orders: [], ordersTotal: 0, appointments: [], appointmentsTotal: 0 };

  const data = prisma
    ? await (async () => {
        const [ordersTotal, appointmentsTotal] = await Promise.all([
          prisma.order.count({ where: orderWhere(profile.email) }),
          prisma.appointment.count({ where: { email: profile.email } }),
        ]);

        const ordersPages = totalPages(ordersTotal);
        const bookingsPages = totalPages(appointmentsTotal);
        const ordersPage = clampPage(ordersPageRaw, ordersPages);
        const bookingsPage = clampPage(bookingsPageRaw, bookingsPages);

        const [orders, appointments] = await Promise.all([
          prisma.order.findMany({
            where: orderWhere(profile.email),
            orderBy: { createdAt: "desc" },
            skip: (ordersPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
          }),
          prisma.appointment.findMany({
            where: { email: profile.email },
            include: { service: true },
            orderBy: { startsAt: "desc" },
            skip: (bookingsPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
          }),
        ]);

        return { orders, ordersTotal, appointments, appointmentsTotal, ordersPage, bookingsPage };
      })()
    : { ...empty, ordersPage: 1, bookingsPage: 1 };

  const ordersPage = "ordersPage" in data ? data.ordersPage : 1;
  const bookingsPage = "bookingsPage" in data ? data.bookingsPage : 1;
  const ordersPages = totalPages(data.ordersTotal);
  const bookingsPages = totalPages(data.appointmentsTotal);

  return (
    <main className={`${pageWide} ${pageShell}`}>
      <h1 className="font-display text-5xl">Hello{profile.name ? `, ${profile.name}` : ""}</h1>
      <p className="mt-3 text-sm text-deep/60">{profile.email}</p>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[11px] tracking-[0.24em] text-deep/45 uppercase">Orders</h2>
            <p className="mt-1 text-sm text-deep/60">{data.ordersTotal} paid orders</p>
          </div>
          <Link href="/shop" className="text-xs font-medium text-deep underline-offset-2 hover:underline">
            Shop again
          </Link>
        </div>

        <div className={`mt-4 overflow-hidden ${surface}`}>
          {data.orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-deep/50">No orders yet.</p>
          ) : (
            <AccountPaginationBars
              page={ordersPage}
              totalPages={ordersPages}
              totalItems={data.ordersTotal}
              pageSize={PAGE_SIZE}
              ordersPage={ordersPage}
              bookingsPage={bookingsPage}
              pageParam="ordersPage"
              itemLabel="orders"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-deep/10 bg-cream/40 text-[11px] tracking-[0.14em] text-deep/45 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Placed</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id} className="border-b border-deep/5 last:border-0 hover:bg-cream/20">
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/orders/${order.accessToken}`}
                            className="font-medium text-deep underline decoration-deep/20 underline-offset-2 hover:decoration-deep"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-deep/70">
                          {formatLagos(order.createdAt, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <AccountStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-deep">
                          {formatNaira(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccountPaginationBars>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[11px] tracking-[0.24em] text-deep/45 uppercase">Bookings</h2>
            <p className="mt-1 text-sm text-deep/60">{data.appointmentsTotal} sessions</p>
          </div>
          <Link
            href="/infusions"
            className="text-xs font-medium text-deep underline-offset-2 hover:underline"
          >
            Book a drip
          </Link>
        </div>

        <div className={`mt-4 overflow-hidden ${surface}`}>
          {data.appointments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-deep/50">No bookings yet.</p>
          ) : (
            <AccountPaginationBars
              page={bookingsPage}
              totalPages={bookingsPages}
              totalItems={data.appointmentsTotal}
              pageSize={PAGE_SIZE}
              ordersPage={ordersPage}
              bookingsPage={bookingsPage}
              pageParam="bookingsPage"
              itemLabel="bookings"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-deep/10 bg-cream/40 text-[11px] tracking-[0.14em] text-deep/45 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Session</th>
                      <th className="px-4 py-3 font-medium">When</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.appointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-deep/5 last:border-0 hover:bg-cream/20"
                      >
                        <td className="px-4 py-3.5 font-medium text-deep">
                          {appointment.service.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-deep/70">
                          {formatLagos(appointment.startsAt, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <AccountStatusBadge status={appointment.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/appointments/${appointment.accessToken}`}
                            className="text-xs font-medium text-deep underline-offset-2 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccountPaginationBars>
          )}
        </div>
      </section>
    </main>
  );
}
