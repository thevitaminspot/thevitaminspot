"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAppointmentStatus } from "@/actions/admin";
import { Modal } from "@/components/ui/modal";
import { interactiveControl } from "@/components/ui/form-styles";
import { adminFormTextarea } from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { withActionError } from "@/lib/server-action-error";

export function AppointmentCancelConfirm({
  open,
  id,
  guestName,
  serviceName,
  when,
  onClose,
}: {
  open: boolean;
  id: string;
  guestName: string;
  serviceName: string;
  when: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function close() {
    if (pending) return;
    setNote("");
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title="Cancel this booking?" size="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-deep/10 bg-cream/30 p-4">
          <p className="text-sm font-medium text-deep">{guestName}</p>
          <p className="mt-1 text-sm text-deep/70">{serviceName}</p>
          <p className="mt-2 text-sm text-deep/60">{when}</p>
        </div>

        <p className="text-sm leading-6 text-deep/65">
          The guest will be emailed immediately. They&apos;ll need to book again if they want a new
          time — this cannot be reversed from the admin panel.
        </p>

        <label className="block text-xs font-medium text-deep/70" htmlFor="cancel-note">
          Internal note <span className="font-normal text-deep/45">(optional)</span>
          <textarea
            id="cancel-note"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            disabled={pending}
            className={`${adminFormTextarea} mt-1.5 box-border max-w-full min-w-0`}
            placeholder="Reason for your records"
          />
        </label>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={close}
            className={`rounded-xl border border-deep/15 px-4 py-2.5 text-[11px] tracking-[0.12em] text-deep uppercase transition hover:bg-cream/40 disabled:opacity-50 ${interactiveControl}`}
          >
            Keep booking
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const result = await withActionError(
                  () => updateAppointmentStatus(id, "CANCELLED"),
                  adminNotifyError,
                  "Could not cancel booking.",
                );
                if (!result) return;
                if ("error" in result && result.error) {
                  adminNotifyError(result.error);
                  return;
                }
                adminNotifySuccess("Booking cancelled.");
                router.refresh();
                close();
              });
            }}
            className={`rounded-xl bg-red-800 px-4 py-2.5 text-[11px] tracking-[0.12em] text-cream uppercase transition hover:bg-red-900 disabled:opacity-60 ${interactiveControl}`}
          >
            {pending ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
