"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { interactiveControl } from "@/components/ui/form-styles";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 bg-deep/40 backdrop-blur-[2px] ${interactiveControl}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 max-h-[min(90vh,640px)] w-full overflow-y-auto rounded-2xl border border-deep/10 bg-white ${
          size === "sm" ? "max-w-sm" : "max-w-md"
        }`}
      >
        <div className="border-b border-deep/8 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="font-display text-xl text-deep">
            {title}
          </h2>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
