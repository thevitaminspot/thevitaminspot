"use client";

import { useState } from "react";
import { fetchSlots, updateAppointment } from "@/actions/booking";

export function AppointmentManager({
  token,
  slug,
}: {
  token: string;
  slug: string;
  durationMin: number;
}) {
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="mt-10 space-y-4">
      <button
        type="button"
        onClick={async () => {
          const result = await updateAppointment(token, "cancel");
          setMessage(result.error ?? "Cancelled.");
        }}
        className="text-[11px] tracking-[0.18em] uppercase underline"
      >
        Cancel
      </button>
      <div className="flex flex-col gap-3">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-lg border border-deep/15 bg-transparent px-4 py-3"
        />
        <button
          type="button"
          onClick={async () => {
            const slots = await fetchSlots(date, slug);
            const first = slots[0];
            if (!first) {
              setMessage("No chairs that day.");
              return;
            }
            const result = await updateAppointment(token, "reschedule", first.start);
            setMessage(result.error ?? `Moved to ${first.label}.`);
          }}
          className="rounded-lg bg-tint px-5 py-3 text-[11px] tracking-[0.18em] uppercase"
        >
          Move to first open hour
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
