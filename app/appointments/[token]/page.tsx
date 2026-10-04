import { AppointmentManager } from "@/components/booking/appointment-manager";
import { findInfusion } from "@/lib/data";
import { tryPrisma } from "@/lib/db";
import { findLocalAppointment } from "@/lib/local-store";
import { whatsappHref } from "@/lib/site";

export const metadata = { title: "Your appointment" };

export default async function AppointmentPage({
  params,
}: PageProps<"/appointments/[token]">) {
  const { token } = await params;
  const prisma = await tryPrisma();
  const row = prisma
    ? await prisma.appointment.findUnique({
        where: { accessToken: token },
        include: { service: true },
      })
    : null;
  const local = row ? null : await findLocalAppointment(token);
  const appointment = row
    ? {
        status: row.status,
        serviceName: row.service.name,
        serviceSlug: row.service.slug,
        durationMin: row.service.durationMin,
        startsAt: row.startsAt,
        name: row.name,
        email: row.email,
      }
    : local
      ? {
          status: local.status,
          serviceName: local.serviceName,
          serviceSlug: local.serviceSlug,
          durationMin: (await findInfusion(local.serviceSlug))?.durationMin ?? 45,
          startsAt: new Date(local.startsAt),
          name: local.name,
          email: local.email,
        }
      : null;

  if (!appointment) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">We can’t find that booking.</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-sage uppercase">{appointment.status}</p>
      <h1 className="font-display mt-3 text-5xl">{appointment.serviceName}</h1>
      <p className="mt-5 leading-8 text-deep/70">
        {appointment.startsAt.toLocaleString("en-NG")}
        <br />
        {appointment.name} · {appointment.email}
      </p>
      <a
        href={whatsappHref(
          `My Vitamin Spot booking is ${appointment.serviceName} on ${appointment.startsAt.toLocaleString("en-NG")}.`,
        )}
        className="mt-6 inline-flex rounded-lg bg-deep px-5 py-3 text-[11px] tracking-[0.18em] text-cream uppercase"
      >
        Share on WhatsApp
      </a>
      <AppointmentManager
        token={token}
        slug={appointment.serviceSlug}
        durationMin={appointment.durationMin}
      />
    </main>
  );
}
