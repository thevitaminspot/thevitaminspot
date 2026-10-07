"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AdminActionMenuItem =
  | {
      type?: "button";
      label: string;
      onClick: () => void;
      disabled?: boolean;
      tone?: "default" | "danger";
    }
  | {
      type: "link";
      label: string;
      href: string;
      external?: boolean;
      onClick?: () => void;
    };

const ITEM_HEIGHT = 36;
const MENU_PADDING = 12;
const MENU_WIDTH = 176;

export function AdminActionMenu({
  label,
  items,
  disabled,
}: {
  label: string;
  items: AdminActionMenuItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }

    function placeMenu() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuHeight = items.length * ITEM_HEIGHT + MENU_PADDING;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 8;
      const top = openUp ? rect.top - menuHeight - gap : rect.bottom + gap;
      const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
      setMenuPos({ top: Math.max(8, top), left: Math.max(8, left) });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open, items.length]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        disabled={disabled}
        className="cursor-pointer rounded-lg p-2 text-deep/70 transition hover:bg-tint hover:text-deep disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && menuPos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-50 w-44 rounded-xl border border-deep/10 bg-white py-1.5 shadow-lg"
            >
              {items.map((item) => {
                if (item.type === "link") {
                  return (
                    <Link
                      key={item.label}
                      role="menuitem"
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="block cursor-pointer px-4 py-2 text-xs text-deep hover:bg-tint"
                      onClick={() => {
                        item.onClick?.();
                        close();
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={`block w-full cursor-pointer px-4 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                      item.tone === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-deep hover:bg-tint"
                    }`}
                    onClick={() => {
                      item.onClick();
                      close();
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
