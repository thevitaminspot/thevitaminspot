"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageRange } from "@/lib/pagination";

const controlClass =
  "inline-flex items-center gap-1 rounded-lg border border-deep/15 bg-white px-3 py-1.5 text-xs font-medium text-deep transition hover:bg-cream/50 disabled:pointer-events-none disabled:opacity-40";

export type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  edge?: "top" | "bottom";
};

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "results",
  edge = "bottom",
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const { from, to } = pageRange(page, pageSize, totalItems);
  const borderClass = edge === "top" ? "border-b border-deep/6" : "border-t border-deep/6";

  return (
    <div
      className={`flex flex-col gap-3 ${borderClass} bg-cream/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between`}
    >
      <p className="text-xs text-deep/50">
        Showing {from}–{to} of {totalItems} {itemLabel}
      </p>
      <nav className="flex items-center gap-2" aria-label="Pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={controlClass}
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Previous
        </button>
        <span className="min-w-[5.5rem] text-center text-xs text-deep/60">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={controlClass}
        >
          Next
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </nav>
    </div>
  );
}

export function TablePaginationBars(props: TablePaginationProps) {
  if (props.totalItems === 0) return null;
  return (
    <>
      <TablePagination {...props} edge="top" />
      <TablePagination {...props} edge="bottom" />
    </>
  );
}
