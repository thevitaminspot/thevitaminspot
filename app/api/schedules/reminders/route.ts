import { handleSchedule } from "@vercel/schedules";
import { formatLagosLong } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";
import {
  emailDetailsCard,
  emailParagraph,
  escapeHtml,
  sendMail,
} from "@/lib/email";
import { invalidateAvailabilityCache, redisAcquireOnce } from "@/lib/redis";
import { site } from "@/lib/site";

const STALE_PENDING_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_START_MS = 23 * 60 * 60 * 1000;
const REMINDER_WINDOW_END_MS = 24 * 60 * 60 * 1000;

export const POST = handleSchedule(async (metadata) => {
  const claimed = await redisAcquireOnce(`tvs:sched:${metadata.executionId}`, 3600);
  if (!claimed) return;

  const prisma = await tryPrisma();
  if (!prisma) return;

  const now = Date.now();
  const staleBefore = new Date(now - STALE_PENDING_MS);
  const windowStart = new Date(now + REMINDER_WINDOW_START_MS);
  const windowEnd = new Date(now + REMINDER_WINDOW_END_MS);

  // 1. Send 24-hour reminders for confirmed upcoming IV lounge sessions.
  const upcoming = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { gte: windowStart, lt: windowEnd },
    },
    include: { service: { select: { name: true, durationMin: true } } },
    take: 100,
  });

  let remindersSent = 0;
  for (const appointment of upcoming) {
    const firstTime = await redisAcquireOnce(`tvs:reminder:24h:${appointment.id}`, 48 * 3600);
    if (!firstTime) continue;

    const whenLabel = formatLagosLong(appointment.startsAt);
    const manageUrl = `${site.url}/appointments/${appointment.accessToken}`;
    const result = await sendMail({
      to: appointment.email,
      subject: `Reminder: ${appointment.service.name} tomorrow at ${site.name}`,
      html: `${emailParagraph(
        `Hi <strong>${escapeHtml(appointment.name)}</strong>, looking forward to welcoming you to ${escapeHtml(site.name)} tomorrow.`,
      )}${emailDetailsCard([
        { label: "Session", value: escapeHtml(appointment.service.name) },
        { label: "When", value: escapeHtml(whenLabel) },
        { label: "Duration", value: `${appointment.service.durationMin} minutes` },
        {
          label: "Location",
          value: escapeHtml(`${site.address.line1}, ${site.address.area}, ${site.address.city}`),
        },
      ])}${emailParagraph(
        `Need to reschedule? <a href="${escapeHtml(manageUrl)}">Manage your booking online</a>.`,
      )}`,
    });

    if (result.ok) {
      remindersSent++;
    }
  }

  // 2. Auto-expire abandoned unpaid PENDING bookings and orders older than 24 hours.
  const [expiredAppointments, expiredOrders] = await Promise.all([
    prisma.appointment.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleBefore },
        OR: [{ payment: null }, { payment: { status: { not: "PAID" } } }],
      },
      data: {
        status: "CANCELLED",
        notes: "Automatically expired after 24h without completed booking fee payment.",
      },
    }),
    prisma.order.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: staleBefore },
        OR: [{ payment: null }, { payment: { status: { not: "PAID" } } }],
      },
      data: {
        status: "CANCELLED",
        notes: "Automatically expired after 24h without completed payment.",
      },
    }),
  ]);

  if (expiredAppointments.count > 0) {
    await invalidateAvailabilityCache();
  }

  console.info(
    `[schedule:lounge-maintenance] run=${metadata.executionId} reminders=${remindersSent} expiredAppointments=${expiredAppointments.count} expiredOrders=${expiredOrders.count}`,
  );
});
