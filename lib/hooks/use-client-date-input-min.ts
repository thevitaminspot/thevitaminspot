"use client";

import { useSyncExternalStore } from "react";
import { todayDateInputMin } from "@/lib/datetime";

/** `<input type="date" min>` — empty on server/hydration, then Lagos-local today. */
export function useClientDateInputMin() {
  return useSyncExternalStore(
    () => () => {},
    () => todayDateInputMin(),
    () => "",
  );
}
