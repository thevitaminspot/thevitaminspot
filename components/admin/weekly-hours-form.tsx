"use client";

import { useState, useTransition } from "react";
import { saveWeeklyHours, type WeeklyHoursInput } from "@/actions/admin";
import {
  adminButtonPrimary,
  adminFormControl,
  adminFormLabel,
} from "@/components/ui/form-styles";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayState = {
  weekday: number;
  closed: boolean;
  startHour: number;
  endHour: number;
  slotMin: number;
  bufferMin: number;
};

function toDayState(
  weekday: number,
  rules: { weekday: number; startMin: number; endMin: number; slotMin: number; bufferMin: number }[],
): DayState {
  const match = rules.find((rule) => rule.weekday === weekday);
  if (!match) {
    return {
      weekday,
      closed: true,
      startHour: 10,
      endHour: 18,
      slotMin: 45,
      bufferMin: 15,
    };
  }
  return {
    weekday,
    closed: false,
    startHour: Math.floor(match.startMin / 60),
    endHour: Math.floor(match.endMin / 60),
    slotMin: match.slotMin,
    bufferMin: match.bufferMin,
  };
}

export function WeeklyHoursForm({
  initialRules,
}: {
  initialRules: {
    weekday: number;
    startMin: number;
    endMin: number;
    slotMin: number;
    bufferMin: number;
  }[];
}) {
  const [days, setDays] = useState<DayState[]>(() =>
    dayNames.map((_, weekday) => toDayState(weekday, initialRules)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateDay(weekday: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const payload: WeeklyHoursInput[] = days.map((day) => ({
          weekday: day.weekday,
          closed: day.closed,
          startHour: day.startHour,
          endHour: day.endHour,
          slotMin: day.slotMin,
          bufferMin: day.bufferMin,
        }));
        startTransition(async () => {
          const result = await saveWeeklyHours(payload);
          if ("error" in result) {
            setMessage(result.error ?? "Could not save hours.");
            return;
          }
          setMessage("Hours saved.");
        });
      }}
    >
      <div className="overflow-x-auto rounded-xl border border-deep/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-deep/10 bg-tint/40 text-[11px] tracking-[0.12em] text-deep/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Open</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Slot (min)</th>
              <th className="px-4 py-3 font-medium">Buffer (min)</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.weekday} className="border-b border-deep/6 last:border-0">
                <td className="px-4 py-3 font-medium text-deep">{dayNames[day.weekday]}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-deep/70">
                    <input
                      type="checkbox"
                      checked={!day.closed}
                      onChange={(event) => updateDay(day.weekday, { closed: !event.target.checked })}
                    />
                    <span className="text-xs">{day.closed ? "Closed" : "Open"}</span>
                  </label>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    disabled={day.closed}
                    value={day.startHour}
                    onChange={(event) =>
                      updateDay(day.weekday, { startHour: Number(event.target.value) })
                    }
                    className={`${adminFormControl} w-20 disabled:opacity-40`}
                    aria-label={`${dayNames[day.weekday]} start hour`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    disabled={day.closed}
                    value={day.endHour}
                    onChange={(event) =>
                      updateDay(day.weekday, { endHour: Number(event.target.value) })
                    }
                    className={`${adminFormControl} w-20 disabled:opacity-40`}
                    aria-label={`${dayNames[day.weekday]} end hour`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={15}
                    step={5}
                    disabled={day.closed}
                    value={day.slotMin}
                    onChange={(event) =>
                      updateDay(day.weekday, { slotMin: Number(event.target.value) })
                    }
                    className={`${adminFormControl} w-24 disabled:opacity-40`}
                    aria-label={`${dayNames[day.weekday]} slot minutes`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    step={5}
                    disabled={day.closed}
                    value={day.bufferMin}
                    onChange={(event) =>
                      updateDay(day.weekday, { bufferMin: Number(event.target.value) })
                    }
                    className={`${adminFormControl} w-24 disabled:opacity-40`}
                    aria-label={`${dayNames[day.weekday]} buffer minutes`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`${adminFormLabel} !mt-0 text-deep/50`}>
        Hours are in 24-hour local lounge time (Lagos). Slot is the chair length; buffer is gap before
        the next bookable start.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={adminButtonPrimary}>
          {pending ? "Saving…" : "Save weekly hours"}
        </button>
        {message ? <p className="text-sm text-deep/65">{message}</p> : null}
      </div>
    </form>
  );
}
