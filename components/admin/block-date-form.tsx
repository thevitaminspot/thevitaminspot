"use client";

import { blockDate } from "@/actions/admin";
import { adminButtonPrimary, adminFormControl } from "@/components/ui/form-styles";

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
      <input type="date" name="date" required className={adminFormControl} />
      <input name="reason" placeholder="Reason" className={adminFormControl} />
      <button className={adminButtonPrimary}>Block date</button>
    </form>
  );
}
