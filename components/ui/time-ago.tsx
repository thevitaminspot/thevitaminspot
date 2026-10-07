"use client";

import { useEffect, useState } from "react";
import { formatTimeAgo } from "@/lib/time-ago";

/** Relative time safe for SSR — renders after mount to avoid hydration drift. */
export function TimeAgo({
  value,
  className = "",
  tickMs = 60_000,
}: {
  value: Date | string;
  className?: string;
  tickMs?: number;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => setLabel(formatTimeAgo(value));
    update();
    if (tickMs <= 0) return;
    const id = window.setInterval(update, tickMs);
    return () => window.clearInterval(id);
  }, [value, tickMs]);

  return <span className={className}>{label || "\u00A0"}</span>;
}
