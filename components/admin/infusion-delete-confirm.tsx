"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteInfusion } from "@/actions/admin";
import { Modal } from "@/components/ui/modal";
import { interactiveControl } from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";

export function InfusionDeleteConfirm({
  infusion,
  onClose,
}: {
  infusion: CatalogInfusion | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!infusion) return null;

  const bookings = infusion.appointmentCount ?? 0;
  const willHide = bookings > 0;

  function close() {
    if (pending) return;
    onClose();
  }

  return (
    <Modal
      open={Boolean(infusion)}
      onClose={close}
      title={willHide ? "Hide this session?" : "Delete this session?"}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-deep/10 bg-cream/30 p-4">
          <p className="text-sm font-medium text-deep">{infusion.name}</p>
          <p className="mt-1 text-sm text-deep/70">
            {nairaLabel(infusion.price)} · deposit {nairaLabel(infusion.deposit)} ·{" "}
            {infusion.durationMin} min
          </p>
        </div>

        <p className="text-sm leading-6 text-deep/65">
          {willHide ? (
            <>
              This session has {bookings} booking{bookings === 1 ? "" : "s"} on record, so it
              can&apos;t be permanently removed. It will be <strong>hidden from the booking page</strong>{" "}
              instead — past appointments stay intact.
            </>
          ) : (
            <>
              This will permanently remove <strong>{infusion.name}</strong> from the clinic menu.
              This cannot be undone.
            </>
          )}
        </p>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={close}
            className={`rounded-xl border border-deep/15 px-4 py-2.5 text-[11px] tracking-[0.12em] text-deep uppercase transition hover:bg-cream/40 disabled:opacity-50 ${interactiveControl}`}
          >
            Keep session
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const result = await deleteInfusion(infusion.id);
                if ("error" in result && result.error) {
                  adminNotifyError(result.error);
                  return;
                }
                adminNotifySuccess(willHide ? "Session hidden." : "Session deleted.");
                router.refresh();
                close();
              });
            }}
            className={`rounded-xl bg-red-800 px-4 py-2.5 text-[11px] tracking-[0.12em] text-cream uppercase transition hover:bg-red-900 disabled:opacity-60 ${interactiveControl}`}
          >
            {pending
              ? willHide
                ? "Hiding…"
                : "Deleting…"
              : willHide
                ? "Hide session"
                : "Delete session"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
