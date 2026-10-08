"use client";

import { useState, type ReactNode } from "react";
import { PAGE_SIZE } from "@/lib/pagination";

/** @deprecated Use PAGE_SIZE from `@/lib/pagination` */
export const ADMIN_LIST_PREVIEW = PAGE_SIZE;

type CollapsibleOptions = {
  initialCount?: number;
  uncapped?: boolean;
  resetKey?: string;
};

/** @deprecated Use `usePaginatedList` from `@/hooks/use-paginated-list` */
export function useCollapsibleList<T>(items: T[], options: CollapsibleOptions = {}) {
  const initialCount = options.initialCount ?? PAGE_SIZE;
  const uncapped = options.uncapped ?? false;
  const [expandedState, setExpandedState] = useState<{
    resetKey: string | undefined;
    expanded: boolean;
  }>({ resetKey: options.resetKey, expanded: false });

  const expanded =
    expandedState.resetKey === options.resetKey ? expandedState.expanded : false;

  const setExpanded = (value: boolean | ((prev: boolean) => boolean)) => {
    setExpandedState((current) => {
      const prev =
        current.resetKey === options.resetKey ? current.expanded : false;
      const next = typeof value === "function" ? value(prev) : value;
      return { resetKey: options.resetKey, expanded: next };
    });
  };

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

/** @deprecated Use `TablePagination` from `@/components/ui/table-pagination` */
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

/** @deprecated Use `usePaginatedList` + `TablePagination` */
export function AdminShowMore<T>({
  items,
  initialCount = PAGE_SIZE,
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
