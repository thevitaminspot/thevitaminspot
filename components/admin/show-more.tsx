"use client";

import { useEffect, useState, type ReactNode } from "react";

export const ADMIN_LIST_PREVIEW = 10;

type CollapsibleOptions = {
  initialCount?: number;
  /** When true, always show every item and hide the toggle. */
  uncapped?: boolean;
  /** Change to collapse again after filters or tabs change. */
  resetKey?: string;
};

export function useCollapsibleList<T>(items: T[], options: CollapsibleOptions = {}) {
  const initialCount = options.initialCount ?? ADMIN_LIST_PREVIEW;
  const uncapped = options.uncapped ?? false;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [options.resetKey]);

  const collapsible = !uncapped && items.length > initialCount;
  const visible =
    uncapped || expanded || !collapsible ? items : items.slice(0, initialCount);

  return {
    visible,
    collapsible,
    expanded,
    setExpanded,
    hiddenCount: collapsible && !expanded ? items.length - initialCount : 0,
    total: items.length,
  };
}

export function AdminShowMoreFooter({
  expanded,
  total,
  hiddenCount,
  label,
  onToggle,
}: {
  expanded: boolean;
  total: number;
  hiddenCount: number;
  label?: string;
  onToggle: () => void;
}) {
  if (hiddenCount <= 0 && !expanded) return null;

  const suffix = label ? ` ${label}` : "";

  return (
    <div className="border-t border-deep/6 px-5 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer text-[11px] tracking-[0.12em] text-sage uppercase transition hover:text-deep"
      >
        {expanded ? "Show less" : `Show all ${total}${suffix}`}
      </button>
    </div>
  );
}

export function AdminShowMore<T>({
  items,
  initialCount = ADMIN_LIST_PREVIEW,
  uncapped = false,
  label,
  children,
}: {
  items: T[];
  initialCount?: number;
  uncapped?: boolean;
  label?: string;
  children: (visible: T[]) => ReactNode;
}) {
  const list = useCollapsibleList(items, { initialCount, uncapped });

  return (
    <>
      {children(list.visible)}
      {list.collapsible ? (
        <AdminShowMoreFooter
          expanded={list.expanded}
          total={list.total}
          hiddenCount={list.hiddenCount}
          label={label}
          onToggle={() => list.setExpanded((value) => !value)}
        />
      ) : null}
    </>
  );
}
