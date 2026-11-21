"use client";

import { useSyncExternalStore } from "react";
import { formatTimeAgo } from "@/lib/time-ago";

let nowMinute = 0;
let intervalId: number | null = null;
const listeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  if (nowMinute === 0) nowMinute = Math.floor(Date.now() / 60_000);
  listeners.add(listener);
  if (intervalId === null && typeof window !== "undefined") {
    intervalId = window.setInterval(() => {
      nowMinute = Math.floor(Date.now() / 60_000);
      listeners.forEach((cb) => cb());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getClientClock() {
  return nowMinute || Math.floor(Date.now() / 60_000);
}

function getServerClock() {
  return 0;
}

/** Relative time safe for SSR — renders after mount to avoid hydration drift. */
export function TimeAgo({
  value,
  className = "",
}: {
  value: Date | string;
  className?: string;
  tickMs?: number;
}) {
  const tick = useSyncExternalStore(subscribeClock, getClientClock, getServerClock);
  const label = tick > 0 ? formatTimeAgo(value) : "";

  return <span className={className}>{label || "\u00A0"}</span>;
}
