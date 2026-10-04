"use client";

import { blockDate } from "@/actions/admin";

export function BlockDateForm() {
  return (
    <form
      className="mt-8 flex flex-wrap gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await blockDate(String(form.get("date") ?? ""), String(form.get("reason") ?? ""));
      }}
    >
      <input type="date" name="date" required className="rounded-lg border border-deep/15 bg-white px-3 py-2" />
      <input name="reason" placeholder="Reason" className="rounded-lg border border-deep/15 bg-white px-3 py-2" />
      <button className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.1em] text-cream uppercase">
        Block date
      </button>
    </form>
  );
}
