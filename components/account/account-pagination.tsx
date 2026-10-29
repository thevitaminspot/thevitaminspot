import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageRange } from "@/lib/pagination";

const controlClass =
  "inline-flex items-center gap-1 rounded-lg border border-deep/15 bg-white px-3 py-1.5 text-xs font-medium text-deep transition hover:bg-cream/50 aria-disabled:pointer-events-none aria-disabled:opacity-40";

function pageHref(basePath: string, page: number) {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

export type AccountPaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  edge?: "top" | "bottom";
};

export function AccountPagination({
  basePath,
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  edge = "bottom",
}: AccountPaginationProps) {
  if (totalItems === 0) return null;

  const { from, to } = pageRange(page, pageSize, totalItems);
  const prevPage = page - 1;
  const nextPage = page + 1;
  const borderClass = edge === "top" ? "border-b border-deep/10" : "border-t border-deep/10";

  return (
    <div
      className={`flex flex-col gap-3 ${borderClass} bg-cream/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between`}
    >
      <p className="text-xs text-deep/50">
        Showing {from}–{to} of {totalItems} {itemLabel}
      </p>
      <nav className="flex items-center gap-2" aria-label={`${itemLabel} pagination`}>
        {page <= 1 ? (
          <span className={`${controlClass} opacity-40`} aria-disabled="true">
            <ChevronLeft className="size-3.5" aria-hidden />
            Previous
          </span>
        ) : (
          <Link href={pageHref(basePath, prevPage)} className={controlClass}>
            <ChevronLeft className="size-3.5" aria-hidden />
            Previous
          </Link>
        )}
        <span className="min-w-[5.5rem] text-center text-xs text-deep/60">
          Page {page} of {totalPages}
        </span>
        {page >= totalPages ? (
          <span className={`${controlClass} opacity-40`} aria-disabled="true">
            Next
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        ) : (
          <Link href={pageHref(basePath, nextPage)} className={controlClass}>
            Next
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}

export function AccountPaginationBars({
  children,
  ...props
}: AccountPaginationProps & { children: ReactNode }) {
  if (props.totalItems === 0) return null;
  return (
    <>
      <AccountPagination {...props} edge="top" />
      {children}
      <AccountPagination {...props} edge="bottom" />
    </>
  );
}
