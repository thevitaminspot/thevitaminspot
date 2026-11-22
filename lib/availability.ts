import { lagosDateKey } from "@/lib/datetime";
import { tryPrisma } from "@/lib/db";
import {
  REDIS_KEYS,
  hasRedis,
  redisGet,
  redisGetVersion,
  redisSet,
} from "@/lib/redis";

export const DEFAULT_SLOT_MIN = 45;
export const DEFAULT_BUFFER_MIN = 15;
export const MIN_BOOKING_LEAD_MS = 60 * 60 * 1000;
/** Unpaid pending bookings only hold a chair for 20 minutes so abandoned checkouts release the slot. */
export const PENDING_HOLD_MS = 20 * 60 * 1000;

const RULES_CACHE_TTL_SEC = 10 * 60;
const SLOTS_CACHE_TTL_SEC = 60;

type Rule = {
  weekday: number;
  startMin: number;
  endMin: number;
  slotMin: number;
  bufferMin: number;
};

type SlotItem = { start: string; end: string; label: string };

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

export async function getRules(options?: { fresh?: boolean }): Promise<Rule[]> {
  if (!options?.fresh) {
    const cached = await redisGet<Rule[]>(REDIS_KEYS.availabilityRules);
    if (cached && cached.length > 0) return cached;
  }

  const prisma = await tryPrisma();
  if (!prisma) return defaultRules;

  const rows = await prisma.availabilityRule.findMany({
    where: { isActive: true },
    select: {
      weekday: true,
      startMin: true,
      endMin: true,
      slotMin: true,
      bufferMin: true,
    },
  });
  const rules = rows.length === 0 ? defaultRules : rows;
  await redisSet(REDIS_KEYS.availabilityRules, rules, RULES_CACHE_TTL_SEC);
  return rules;
}

const lagosTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

export async function listSlots(
  dateIso: string,
  durationMin: number,
  options?: { excludeAppointmentId?: string; fresh?: boolean },
): Promise<SlotItem[]> {
  const parts = dateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return [];
  const [year, monthNumber, day] = parts;
  const month = monthNumber - 1;
  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return [];

  const earliest = Date.now() + MIN_BOOKING_LEAD_MS;
  const useCache = !options?.excludeAppointmentId && !options?.fresh && hasRedis();
  let slotCacheKey: string | null = null;

  if (useCache) {
    const version = await redisGetVersion(REDIS_KEYS.availabilityVersion);
    slotCacheKey = `tvs:avail:slots:v${version}:${dateIso}:${durationMin}`;
    const cached = await redisGet<SlotItem[]>(slotCacheKey);
    if (cached) {
      // Re-apply lead-time cutoff in memory so slots crossing the 1-hour threshold drop immediately.
      return cached.filter((slot) => Date.parse(slot.start) > earliest);
    }
  }

  const weekday = date.getUTCDay();
  const prisma = await tryPrisma();

  const [allRules, blocked, taken] = await Promise.all([
    getRules({ fresh: options?.fresh }),
    prisma
      ? prisma.blockedDate.findFirst({
          where: {
            date: {
              gte: new Date(`${dateIso}T00:00:00.000Z`),
              lt: new Date(`${dateIso}T23:59:59.999Z`),
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma
      ? prisma.appointment.findMany({
          where: {
            startsAt: {
              gte: new Date(`${dateIso}T00:00:00+01:00`),
              lt: new Date(`${dateIso}T23:59:59+01:00`),
            },
            ...(options?.excludeAppointmentId
              ? { id: { not: options.excludeAppointmentId } }
              : {}),
            // Confirmed bookings and paid deposits always hold the chair.
            // Unpaid pending holds expire after PENDING_HOLD_MS so abandoned Paystack popups release the slot.
            OR: [
              { status: "CONFIRMED" },
              { status: "PENDING", payment: { status: "PAID" } },
              {
                status: "PENDING",
                createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MS) },
                OR: [{ payment: null }, { payment: { status: "PENDING" } }],
              },
            ],
          },
          select: { startsAt: true, endsAt: true },
        })
      : Promise.resolve([]),
  ]);

  const rules = allRules.filter((rule) => rule.weekday === weekday);
  if (rules.length === 0 || blocked) {
    if (slotCacheKey) await redisSet(slotCacheKey, [], SLOTS_CACHE_TTL_SEC);
    return [];
  }

  const slots: SlotItem[] = [];

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
        label: lagosTimeFormatter.format(start),
      });
    }
  }

  if (slotCacheKey) {
    await redisSet(slotCacheKey, slots, SLOTS_CACHE_TTL_SEC);
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
  // Always validate against live Postgres before reserving or rescheduling a chair.
  const slots = await listSlots(dateIso, durationMin, {
    excludeAppointmentId,
    fresh: true,
  });
  return slots.some((slot) => slot.start === start.toISOString());
}
