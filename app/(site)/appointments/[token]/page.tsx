import { AppointmentManager } from "@/components/booking/appointment-manager";
import { PayDepositButton } from "@/components/booking/pay-deposit-button";
import { findInfusion } from "@/lib/data";
import { tryPrisma } from "@/lib/db";
import { findLocalAppointment } from "@/lib/local-store";
import { confirmPaystackReturn } from "@/lib/payments";
import { formatLagosLong } from "@/lib/datetime";
import { whatsappHref } from "@/lib/site";

export const metadata = { title: "Your appointment", robots: { index: false, follow: false } };
export const instant = false;

export default async function AppointmentPage({
  params,
  searchParams,
}: PageProps<"/appointments/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const reference = typeof query.reference === "string" ? query.reference : query.trxref;
  await confirmPaystackReturn(
    typeof reference === "string" ? reference : undefined,
    { appointmentToken: token },
  );
  const prisma = await tryPrisma();
  const row = prisma
    ? await prisma.appointment.findUnique({
        where: { accessToken: token },
        include: { service: true, payment: true },
      })
    : null;
  const local = row ? null : await findLocalAppointment(token);
  const paidDeposit = row?.payment?.status === "PAID";
  const appointment = row
    ? {
        status: row.status,
        serviceName: row.service.name,
        serviceSlug: row.service.slug,
        durationMin: row.service.durationMin,
        deposit: row.service.deposit,
        depositPaid: paidDeposit,
        startsAt: row.startsAt,
        name: row.name,
        email: row.email,
        showPayDeposit:
          row.status === "PENDING" && !paidDeposit && row.service.deposit > 0,
      }
    : local
      ? {
          status: local.status,
          serviceName: local.serviceName,
          serviceSlug: local.serviceSlug,
          durationMin: (await findInfusion(local.serviceSlug))?.durationMin ?? 45,
          deposit: (await findInfusion(local.serviceSlug))?.deposit,
          depositPaid: false,
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
      <p
        className={`text-[11px] tracking-[0.28em] uppercase ${
          appointment.status === "CANCELLED"
            ? "text-deep/45"
            : appointment.status === "CONFIRMED"
              ? "text-sage"
              : "text-deep/55"
        }`}
      >
        {appointment.status === "CANCELLED"
          ? "Cancelled"
          : appointment.status === "CONFIRMED"
            ? "Confirmed"
            : appointment.status === "COMPLETED"
              ? "Completed"
              : "Pending confirmation"}
      </p>
      <h1 className="font-display mt-3 text-5xl">{appointment.serviceName}</h1>
      <p className="mt-5 leading-8 text-deep/70">
        {formatLagosLong(appointment.startsAt)}
        <br />
        {appointment.name} · {appointment.email}
      </p>
      {appointment.status !== "CANCELLED" &&
      "showPayDeposit" in appointment &&
      appointment.showPayDeposit ? (
        <PayDepositButton token={token} deposit={appointment.deposit} />
      ) : null}
      {appointment.status !== "CANCELLED" ? (
        <a
          href={whatsappHref(
            `My Vitamin Spot booking is ${appointment.serviceName} on ${formatLagosLong(appointment.startsAt)}.`,
          )}
          className="mt-6 inline-flex rounded-lg border border-deep/15 px-5 py-3 text-[11px] tracking-[0.18em] text-deep uppercase"
        >
          Share on WhatsApp
        </a>
      ) : null}
      <AppointmentManager
        token={token}
        slug={appointment.serviceSlug}
        serviceName={appointment.serviceName}
        startsAt={appointment.startsAt}
        status={appointment.status}
        deposit={"deposit" in appointment ? appointment.deposit : undefined}
        depositPaid={"depositPaid" in appointment ? appointment.depositPaid : undefined}
      />
    </main>
  );
}
