"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockDate } from "@/actions/admin";
import { Modal } from "@/components/ui/modal";
import {
  adminButtonPrimary,
  adminFormControl,
  adminFormLabel,
} from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";

export function BlockDateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-deep/60">Close the lounge for holidays or private days.</p>
        <button type="button" onClick={() => setOpen(true)} className={adminButtonPrimary}>
          Block a date
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Block a date"
        description="Guests will not be able to book this day online."
        size="sm"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const date = String(form.get("date") ?? "");
            const reason = String(form.get("reason") ?? "");
            start(async () => {
              const result = await blockDate(date, reason);
              if ("error" in result && result.error) {
                adminNotifyError(result.error);
                return;
              }
              adminNotifySuccess("Date blocked.");
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <div>
            <label className={adminFormLabel} htmlFor="block-date">
              Date
            </label>
            <input
              id="block-date"
              type="date"
              name="date"
              required
              className={`${adminFormControl} mt-1.5`}
            />
          </div>
          <div>
            <label className={adminFormLabel} htmlFor="block-reason">
              Reason <span className="font-normal text-deep/40">optional</span>
            </label>
            <input
              id="block-reason"
              name="reason"
              placeholder="Holiday, private hire…"
              className={`${adminFormControl} mt-1.5`}
            />
          </div>
          <button type="submit" disabled={pending} className={`${adminButtonPrimary} w-full`}>
            {pending ? "Saving…" : "Block date"}
          </button>
        </form>
      </Modal>
    </>
  );
}
