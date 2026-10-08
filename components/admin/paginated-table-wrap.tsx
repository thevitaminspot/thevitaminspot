"use client";

import type { ReactNode } from "react";
import { AdminPanel } from "@/components/admin/ui";
import { TablePagination, type TablePaginationProps } from "@/components/ui/table-pagination";

export function PaginatedTableWrap({
  children,
  pagination,
  scroll = true,
}: {
  children: ReactNode;
  pagination: TablePaginationProps;
  scroll?: boolean;
}) {
  return (
    <AdminPanel className="overflow-hidden">
      <TablePagination {...pagination} edge="top" />
      {scroll ? <div className="overflow-x-auto">{children}</div> : children}
      <TablePagination {...pagination} edge="bottom" />
    </AdminPanel>
  );
}
