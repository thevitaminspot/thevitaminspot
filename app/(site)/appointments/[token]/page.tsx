import Link from "next/link";
import { AppointmentManager } from "@/components/booking/appointment-manager";
import { PayDepositButton } from "@/components/booking/pay-deposit-button";
import { RefreshWhilePending } from "@/components/ui/refresh-while-pending";
import { findInfusion } from "@/lib/data";
import { tryPrisma } from "@/lib/db";
import { findLocalAppointment } from "@/lib/local-store";
import { confirmPaystackReturn } from "@/lib/payments";
import { formatLagosLong } from "@/lib/datetime";
import { site, whatsappHref } from "@/lib/site";
import { pageNarrow, pageShell, surfaceMuted } from "@/components/ui/layout-styles";

export const metadata = { title: "Your appointment", robots: { index: false, follow: false } };
export const instant = false;

function bookingHeadline(status: string, depositPaid: boolean) {
  if (status === "CANCELLED") return "This booking was cancelled";
  if (status === "COMPLETED") return "Session done";
  if (status === "CONFIRMED") return "You’re booked";
  if (depositPaid) return "Deposit received";
  return "Booking received";
}

function bookingNextStep(status: string, depositPaid: boolean, needsDeposit: boolean) {
  if (status === "CANCELLED") return "If this looks wrong, WhatsApp us and we’ll help.";
  if (status === "COMPLETED") return "Thanks for coming in.";
  if (status === "CONFIRMED") {
    return `Come a few minutes early. We’re at ${site.address.label}.`;
  }
  if (needsDeposit && !depositPaid) {
    return "Pay the deposit to hold the slot, or wait for us to confirm.";
  }
  return "We’ll confirm this slot shortly. You’ll get an email.";
}

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
      <main className={`${pageNarrow} ${pageShell} text-center`}>
        <h1 className="font-display text-4xl">We can’t find that booking.</h1>
        <p className="mt-3 text-sm text-deep/60">Check the link from your email, or book again.</p>
        <Link href="/book" className="mt-6 inline-flex text-sm font-medium text-deep underline underline-offset-2">
          Book a session
        </Link>
      </main>
    );
  }

  const needsDeposit =
    Boolean("showPayDeposit" in appointment && appointment.showPayDeposit);
  const confirmingDeposit = needsDeposit && typeof reference === "string";

  return (
    <main className={`${pageNarrow} ${pageShell}`}>
      <RefreshWhilePending active={confirmingDeposit} />
      <p className="text-[11px] tracking-[0.28em] text-sage uppercase">
        {appointment.status === "CANCELLED"
          ? "Cancelled"
          : appointment.status === "CONFIRMED"
            ? "Confirmed"
            : appointment.status === "COMPLETED"
              ? "Completed"
              : "Pending"}
      </p>
      <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
        {bookingHeadline(appointment.status, Boolean(appointment.depositPaid))}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-deep/70">
        {bookingNextStep(
          appointment.status,
          Boolean(appointment.depositPaid),
          needsDeposit,
        )}
      </p>
      {confirmingDeposit ? (
        <p className={`${surfaceMuted} mt-4 px-4 py-3 text-sm text-deep/70`}>
          Checking Paystack… this page will update on its own.
        </p>
      ) : null}
      <p className="mt-6 leading-8 text-deep">
        {appointment.serviceName}
        <br />
        <span className="text-deep/70">{formatLagosLong(appointment.startsAt)}</span>
        <br />
        <span className="text-sm text-deep/55">
          {appointment.name} · {appointment.email}
        </span>
      </p>
      {appointment.status !== "CANCELLED" && needsDeposit ? (
        <PayDepositButton token={token} deposit={appointment.deposit ?? 0} />
      ) : null}
      {appointment.status !== "CANCELLED" ? (
        <a
          href={whatsappHref(
            `My Vitamin Spot booking is ${appointment.serviceName} on ${formatLagosLong(appointment.startsAt)}.`,
          )}
          className="mt-6 inline-flex rounded-lg border border-deep/15 px-5 py-3 text-sm font-medium text-deep"
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
