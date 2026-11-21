"use client";

import { Modal } from "@/components/ui/modal";
import { interactiveControl } from "@/components/ui/form-styles";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={pending ? () => undefined : onClose}
      title={title}
      size="sm"
    >
      <p className="text-sm leading-relaxed text-deep/70">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={`rounded-xl border border-deep/15 px-4 py-2.5 text-[11px] tracking-[0.12em] text-deep uppercase transition hover:bg-cream/40 disabled:opacity-50 ${interactiveControl}`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2.5 text-[11px] tracking-[0.12em] text-cream uppercase transition disabled:opacity-60 ${interactiveControl} ${
            danger
              ? "bg-red-800 hover:bg-red-900"
              : "bg-deep hover:bg-deep-hover"
          }`}
        >
          {pending ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
