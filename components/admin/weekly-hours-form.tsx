"use client";

import { useMemo, useState, useTransition } from "react";
import { saveWeeklyHours, type WeeklyHoursInput } from "@/actions/admin";
import { AdminPanel } from "@/components/admin/ui";
import {
  adminButtonPrimary,
  adminFormControl,
  adminFormLabel,
} from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 → 23

type RuleInput = {
  weekday: number;
  startMin: number;
  endMin: number;
  slotMin: number;
  bufferMin: number;
};

function formatHour(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? "pm" : "am";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

function sharedDefaults(rules: RuleInput[]) {
  if (rules.length === 0) {
    return { startHour: 10, endHour: 18, slotMin: 45, bufferMin: 15 };
  }
  const first = rules[0];
  return {
    startHour: Math.floor(first.startMin / 60),
    endHour: Math.floor(first.endMin / 60),
    slotMin: first.slotMin,
    bufferMin: first.bufferMin,
  };
}

export function WeeklyHoursForm({ initialRules }: { initialRules: RuleInput[] }) {
  const defaults = useMemo(() => sharedDefaults(initialRules), [initialRules]);
  const [openDays, setOpenDays] = useState<boolean[]>(() => {
    const open = new Set(initialRules.map((rule) => rule.weekday));
    return dayNames.map((_, weekday) => open.has(weekday));
  });
  const [startHour, setStartHour] = useState(defaults.startHour);
  const [endHour, setEndHour] = useState(defaults.endHour);
  const [slotMin, setSlotMin] = useState(defaults.slotMin);
  const [bufferMin, setBufferMin] = useState(defaults.bufferMin);
  const [pending, startTransition] = useTransition();

  const openCount = openDays.filter(Boolean).length;

  function toggleDay(weekday: number) {
    setOpenDays((prev) => prev.map((open, index) => (index === weekday ? !open : open)));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (endHour <= startHour) {
          adminNotifyError("Closing time must be after opening time.");
          return;
        }
        const payload: WeeklyHoursInput[] = dayNames.map((_, weekday) => ({
          weekday,
          closed: !openDays[weekday],
          startHour,
          endHour,
          slotMin,
          bufferMin,
        }));
        startTransition(async () => {
          const result = await saveWeeklyHours(payload);
          if ("error" in result) {
            adminNotifyError(result.error ?? "Could not save hours.");
            return;
          }
          adminNotifySuccess("Hours saved.");
        });
      }}
    >
      <AdminPanel className="p-5 md:p-6">
        <div>
          <p className={adminFormLabel}>Open days</p>
          <p className="mt-1 text-xs text-deep/50">Tap a day to open or close the lounge.</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {dayNames.map((name, weekday) => {
              const open = openDays[weekday];
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => toggleDay(weekday)}
                    aria-pressed={open}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      open
                        ? "border-deep bg-deep text-cream"
                        : "border-deep/12 bg-cream/40 text-deep/45 hover:border-deep/25 hover:text-deep/70"
                    }`}
                  >
                    <span className="block text-sm font-medium">{dayShort[weekday]}</span>
                    <span className="mt-1 block text-[10px] tracking-[0.16em] uppercase opacity-80">
                      {open ? "Open" : "Closed"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={`mt-8 grid gap-5 border-t border-deep/8 pt-8 sm:grid-cols-2 ${
            openCount === 0 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <div>
            <label className={adminFormLabel} htmlFor="hours-start">
              Opens
            </label>
            <select
              id="hours-start"
              name="startHour"
              value={startHour}
              disabled={openCount === 0}
              onChange={(event) => setStartHour(Number(event.target.value))}
              className={`${adminFormControl} mt-1.5`}
            >
              {HOUR_OPTIONS.filter((hour) => hour < 23).map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminFormLabel} htmlFor="hours-end">
              Closes
            </label>
            <select
              id="hours-end"
              name="endHour"
              value={endHour}
              disabled={openCount === 0}
              onChange={(event) => setEndHour(Number(event.target.value))}
              className={`${adminFormControl} mt-1.5`}
            >
              {HOUR_OPTIONS.filter((hour) => hour > 7).map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminFormLabel} htmlFor="hours-slot">
              Session length
            </label>
            <select
              id="hours-slot"
              name="slotMin"
              value={slotMin}
              disabled={openCount === 0}
              onChange={(event) => setSlotMin(Number(event.target.value))}
              className={`${adminFormControl} mt-1.5`}
            >
              {[30, 45, 60, 75, 90].map((mins) => (
                <option key={mins} value={mins}>
                  {mins} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminFormLabel} htmlFor="hours-buffer">
              Buffer between sessions
            </label>
            <select
              id="hours-buffer"
              name="bufferMin"
              value={bufferMin}
              disabled={openCount === 0}
              onChange={(event) => setBufferMin(Number(event.target.value))}
              className={`${adminFormControl} mt-1.5`}
            >
              {[0, 10, 15, 20, 30].map((mins) => (
                <option key={mins} value={mins}>
                  {mins === 0 ? "No buffer" : `${mins} minutes`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-deep/50">
          {openCount === 0
            ? "No open days selected — online booking will show no slots."
            : `Applies to all open days · Lagos time · ${formatHour(startHour)}–${formatHour(endHour)}`}
        </p>

        <div className="mt-6">
          <button type="submit" disabled={pending} className={adminButtonPrimary}>
            {pending ? "Saving…" : "Save weekly hours"}
          </button>
        </div>
      </AdminPanel>
    </form>
  );
}
