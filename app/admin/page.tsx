import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { listProducts } from "@/lib/data";
import { readLocalAppointments } from "@/lib/local-store";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Admin" };

const lagos = "Africa/Lagos";

function when(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: lagos,
  }).format(new Date(value));
}

function todayLabel(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: lagos,
  }).format(now);
}

type Attention = {
  id: string;
  href: string;
  kind: string;
  title: string;
  detail: string;
};

const orderKind: Record<string, string> = {
  PENDING: "New order",
  PAID: "Pack",
  PACKED: "Send",
  OUT_FOR_DELIVERY: "On the way",
};

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-4xl">The back room is locked.</h1>
        <p className="mt-4 text-deep/70">Sign in with an admin email.</p>
        <Link href="/login" className="mt-6 inline-block underline">
          Sign in
        </Link>
      </main>
    );
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const soon = now.getTime() + 48 * 60 * 60 * 1000;
  const prisma = await tryPrisma();

  const [catalog, appointments, orders] = await Promise.all([
    listProducts(),
    loadAppointments(prisma, start),
    prisma
      ? prisma.order.findMany({
          where: { status: { in: ["PENDING", "PAID", "PACKED", "OUT_FOR_DELIVERY"] } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const pending = appointments.filter((row) => row.status === "PENDING");
  const coming = appointments.filter((row) => {
    if (row.status !== "CONFIRMED") return false;
    const time = new Date(row.startsAt).getTime();
    return time >= start.getTime() && time <= soon;
  });
  const later = appointments.filter((row) => {
    if (row.status !== "CONFIRMED") return false;
    return new Date(row.startsAt).getTime() > soon;
  });
  const low = catalog
    .filter((product) => product.stock <= 5)
    .sort((left, right) => left.stock - right.stock);

  const attention: Attention[] = [
    ...pending.map((row) => ({
      id: `booking-${row.id}`,
      href: "/admin/appointments",
      kind: "Accept",
      title: `${row.serviceName} · ${row.name}`,
      detail: when(row.startsAt),
    })),
    ...coming.map((row) => ({
      id: `soon-${row.id}`,
      href: "/admin/appointments",
      kind: "Coming in",
      title: `${row.serviceName} · ${row.name}`,
      detail: when(row.startsAt),
    })),
    ...later.map((row) => ({
      id: `later-${row.id}`,
      href: "/admin/appointments",
      kind: "Booked",
      title: `${row.serviceName} · ${row.name}`,
      detail: when(row.startsAt),
    })),
    ...orders.map((row) => ({
      id: `order-${row.id}`,
      href: "/admin/orders",
      kind: orderKind[row.status] ?? "Order",
      title: `${row.orderNumber} · ${row.name}`,
      detail: formatNaira(row.total),
    })),
    ...low.map((product) => ({
      id: `stock-${product.id}`,
      href: "/admin/products",
      kind: product.stock === 0 ? "Out of stock" : "Low stock",
      title: product.name,
      detail: product.stock === 0 ? "None left" : `${product.stock} left`,
    })),
  ];

  const places = [
    {
      href: "/admin/appointments",
      label: "Appointments",
      note:
        pending.length > 0
          ? `${pending.length} to accept`
          : coming.length + later.length > 0
            ? `${coming.length + later.length} booked`
            : "None waiting",
    },
    {
      href: "/admin/orders",
      label: "Orders",
      note: orders.length === 0 ? "None open" : `${orders.length} still open`,
    },
    {
      href: "/admin/products",
      label: "Products",
      note: low.length === 0 ? "Stock looks fine" : `${low.length} running low`,
    },
    { href: "/admin/infusions", label: "Infusions", note: "Session prices" },
    { href: "/admin/availability", label: "Availability", note: "Hours and blocked days" },
  ];

  return (
    <div>
      <h1 className="font-display text-5xl text-deep">What needs you</h1>
      <p className="mt-3 text-sm text-deep/60">{todayLabel(now)}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <li key={place.href}>
            <Link href={place.href} className="panel block bg-white px-4 py-4 hover:border-sage">
              <span className="block font-medium text-deep">{place.label}</span>
              <span className="mt-1 block text-sm text-deep/55">{place.note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8" aria-label="Needs attention">
        {attention.length === 0 ? (
          <p className="panel bg-white px-5 py-6 text-sm leading-7 text-deep/70">
            Nothing is waiting. Bookings, orders, and stock are clear.
          </p>
        ) : (
          <ul className="divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white">
            {attention.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex items-center gap-4 px-4 py-4 hover:bg-cream">
                  <span className="w-28 shrink-0 text-[11px] tracking-[0.12em] text-sage uppercase">
                    {item.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-deep">{item.title}</span>
                    <span className="mt-1 block text-sm text-deep/55">{item.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function loadAppointments(
  prisma: Awaited<ReturnType<typeof tryPrisma>>,
  start: Date,
) {
  if (prisma) {
    const count = await prisma.appointment.count();
    if (count > 0) {
      const rows = await prisma.appointment.findMany({
        where: {
          OR: [
            { status: "PENDING" },
            { status: "CONFIRMED", startsAt: { gte: start } },
          ],
        },
        include: { service: true },
        orderBy: { startsAt: "asc" },
      });
      return rows.map((row) => ({
        id: row.id,
        startsAt: row.startsAt.toISOString(),
        name: row.name,
        status: row.status,
        serviceName: row.service.name,
      }));
    }
  }

  const local = await readLocalAppointments();
  return local
    .filter((row) => row.status === "PENDING" || row.status === "CONFIRMED")
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .map((row) => ({
      id: row.id,
      startsAt: row.startsAt,
      name: row.name,
      status: row.status,
      serviceName: row.serviceName,
    }));
}
