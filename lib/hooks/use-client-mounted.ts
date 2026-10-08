"use client";

import { useSyncExternalStore } from "react";

/** True only after the client has hydrated — use for UI that must match SSR HTML. */
export function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
