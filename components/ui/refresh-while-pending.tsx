"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshWhilePending({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      router.refresh();
      if (ticks >= 8) window.clearInterval(id);
    }, 2500);
    return () => window.clearInterval(id);
  }, [active, router]);

  return null;
}
