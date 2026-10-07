import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { tryPrisma } from "@/lib/db";
import { hasClerk } from "@/lib/env";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Account", robots: { index: false, follow: false } };
export const instant = false;

export default async function AccountPage() {
  if (!hasClerk()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
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
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-deep">Your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-deep/70">
          Sign in to see your orders and drip bookings.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-deep px-6 py-3.5 text-xs font-medium tracking-[0.15em] text-cream uppercase transition hover:bg-[#14382a]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex rounded-xl border border-deep/20 bg-white/60 px-6 py-3.5 text-xs font-medium tracking-[0.15em] text-deep uppercase transition hover:bg-white"
          >
            Create account
          </Link>
        </div>
        <div className="mt-12 rounded-2xl border border-deep/10 bg-white/60 p-4 text-xs text-deep/65">
          <p className="font-medium text-deep">Checking out or booking as a guest?</p>
          <p className="mt-1">
            You don&apos;t need an account to buy a pack or book a drip.
          </p>
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

  const prisma = await tryPrisma();
  const [orders, appointments] = prisma
    ? await Promise.all([
        prisma.order.findMany({
          where: { email: profile.email, payment: { status: "PAID" } },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
        prisma.appointment.findMany({
          where: { email: profile.email },
          include: { service: true },
          orderBy: { startsAt: "desc" },
          take: 12,
        }),
      ])
    : [[], []];

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-5xl">Hello{profile.name ? `, ${profile.name}` : ""}</h1>
      <p className="mt-3 text-sm text-deep/60">{profile.email}</p>
      <section className="mt-12">
        <h2 className="text-[11px] tracking-[0.24em] uppercase">Orders</h2>
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <div className="relative rounded-2xl border border-deep/10 bg-white px-5 py-4 transition hover:border-deep/30 hover:shadow-sm">
                <Link
                  href={`/orders/${order.accessToken}`}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={`${order.orderNumber}, ${order.status}, ${formatNaira(order.total)}`}
                />
                <div className="pointer-events-none flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-deep">{order.orderNumber}</span>
                  <span className="text-deep/70">
                    {order.status} · {formatNaira(order.total)}
                  </span>
                </div>
              </div>
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
              <div className="relative rounded-2xl border border-deep/10 bg-white px-5 py-4 transition hover:border-deep/30 hover:shadow-sm">
                <Link
                  href={`/appointments/${appointment.accessToken}`}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={`${appointment.service.name}, ${appointment.status}`}
                />
                <p className="pointer-events-none text-sm text-deep">
                  <span className="font-medium">{appointment.service.name}</span>
                  <span className="text-deep/70">
                    {" "}
                    · {appointment.startsAt.toLocaleString("en-NG")} · {appointment.status}
                  </span>
                </p>
              </div>
            </li>
          ))}
          {appointments.length === 0 ? <li className="text-deep/50">No bookings yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
