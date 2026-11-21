import { lagosDateKey } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";

export const DEFAULT_SLOT_MIN = 45;
export const DEFAULT_BUFFER_MIN = 15;
export const MIN_BOOKING_LEAD_MS = 60 * 60 * 1000;

type Rule = {
  weekday: number;
  startMin: number;
  endMin: number;
  slotMin: number;
  bufferMin: number;
};

const defaultRules: Rule[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startMin: 10 * 60,
  endMin: 18 * 60,
  slotMin: DEFAULT_SLOT_MIN,
  bufferMin: DEFAULT_BUFFER_MIN,
}));

function lagosDate(year: number, month: number, day: number, minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(Date.UTC(year, month, day, hours - 1, mins));
}

export async function getRules(): Promise<Rule[]> {
  const prisma = await tryPrisma();
  if (!prisma) return defaultRules;

  const rows = await prisma.availabilityRule.findMany({
    where: { isActive: true },
  });
  return rows.length === 0 ? defaultRules : rows;
}

export async function listSlots(
  dateIso: string,
  durationMin: number,
  options?: { excludeAppointmentId?: string },
) {
  const parts = dateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return [];
  const [year, monthNumber, day] = parts;
  const month = monthNumber - 1;
  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return [];

  const weekday = date.getUTCDay();
  const rules = (await getRules()).filter((rule) => rule.weekday === weekday);
  if (rules.length === 0) return [];

  const prisma = await tryPrisma();
  const blocked = prisma
    ? await prisma.blockedDate.findFirst({
        where: {
          date: {
            gte: new Date(`${dateIso}T00:00:00.000Z`),
            lt: new Date(`${dateIso}T23:59:59.999Z`),
          },
        },
      })
    : null;
  if (blocked) return [];

  const taken = prisma
    ? await prisma.appointment.findMany({
        where: {
          startsAt: {
            gte: new Date(`${dateIso}T00:00:00+01:00`),
            lt: new Date(`${dateIso}T23:59:59+01:00`),
          },
          ...(options?.excludeAppointmentId
            ? { id: { not: options.excludeAppointmentId } }
            : {}),
          // Confirmed bookings always hold the chair. Pending holds only while
          // the booking-fee payment is still in flight — failed fees do not.
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING",
              OR: [
                { payment: null },
                { payment: { status: { in: ["PENDING", "PAID"] } } },
              ],
            },
          ],
        },
      })
    : [];

  const slots: { start: string; end: string; label: string }[] = [];
  const earliest = Date.now() + MIN_BOOKING_LEAD_MS;

  for (const rule of rules) {
    const step = rule.slotMin + rule.bufferMin;
    for (
      let cursor = rule.startMin;
      cursor + durationMin <= rule.endMin;
      cursor += step
    ) {
      const start = lagosDate(year, month, day, cursor);
      if (start.getTime() <= earliest) continue;

      const end = new Date(start.getTime() + durationMin * 60_000);
      const overlaps = taken.some(
        (appointment) =>
          start < appointment.endsAt && end > appointment.startsAt,
      );
      if (overlaps) continue;

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        label: new Intl.DateTimeFormat("en-NG", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Lagos",
        }).format(start),
      });
    }
  }

  return slots;
}

export async function isBookableStart(
  start: Date,
  durationMin: number,
  excludeAppointmentId?: string,
) {
  if (Number.isNaN(start.getTime())) return false;
  const dateIso = lagosDateKey(start);
  const slots = await listSlots(dateIso, durationMin, { excludeAppointmentId });
  return slots.some((slot) => slot.start === start.toISOString());
}
