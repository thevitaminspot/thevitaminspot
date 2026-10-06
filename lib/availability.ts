import { tryPrisma } from "@/lib/db";

export const DEFAULT_SLOT_MIN = 45;
export const DEFAULT_BUFFER_MIN = 15;

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

export async function listSlots(dateIso: string, durationMin: number) {
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
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: {
            gte: new Date(`${dateIso}T00:00:00+01:00`),
            lt: new Date(`${dateIso}T23:59:59+01:00`),
          },
        },
      })
    : [];

  const slots: { start: string; end: string; label: string }[] = [];

  for (const rule of rules) {
    const step = rule.slotMin + rule.bufferMin;
    for (
      let cursor = rule.startMin;
      cursor + durationMin <= rule.endMin;
      cursor += step
    ) {
      const start = lagosDate(year, month, day, cursor);
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
