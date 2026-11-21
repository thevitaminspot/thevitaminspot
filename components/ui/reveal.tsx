"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

let sharedMediaQuery: MediaQueryList | null = null;
function getMediaQuery() {
  if (!sharedMediaQuery && typeof window !== "undefined") {
    sharedMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return sharedMediaQuery;
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = getMediaQuery();
  if (!mq) return () => {};
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return getMediaQuery()?.matches ?? false;
}

const revealCallbacks = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function observeReveal(node: Element, onVisible: () => void) {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const callback = revealCallbacks.get(entry.target);
          revealCallbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
          callback?.();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
  }
  revealCallbacks.set(node, onVisible);
  sharedObserver.observe(node);
  return () => {
    revealCallbacks.delete(node);
    sharedObserver?.unobserve(node);
  };
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const [revealed, setRevealed] = useState(false);
  const visible = reducedMotion || revealed;

  const showVisible = useSyncExternalStore(
    () => () => {},
    () => visible,
    () => false,
  );

  useEffect(() => {
    if (reducedMotion || revealed) return;
    const node = ref.current;
    if (!node) return;
    return observeReveal(node, () => setRevealed(true));
  }, [reducedMotion, revealed]);

  const style: CSSProperties | undefined = delay
    ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={`reveal ${showVisible ? "is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
