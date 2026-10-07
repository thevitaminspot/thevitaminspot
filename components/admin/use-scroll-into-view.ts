"use client";

import { useEffect, useRef } from "react";

/** Scrolls the ref into view when `key` becomes truthy (e.g. editing id or "add"). */
export function useScrollIntoView<T extends HTMLElement>(key: string | null | false | undefined) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!key) return;
    const id = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 64);
    return () => clearTimeout(id);
  }, [key]);

  return ref;
}
