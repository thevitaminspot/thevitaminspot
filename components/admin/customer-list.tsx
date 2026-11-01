"use client";

import { useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/ui";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatNaira } from "@/lib/money";

export type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
};

function customerSearchText(row: CustomerRow) {
  return `${row.name} ${row.email} ${row.phone}`;
}

export function AdminCustomerList({ rows }: { rows: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterByQuery(rows, query, customerSearchText),
    [rows, query],
  );

  const pagination = usePaginatedList(filtered, query);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Customers"
        description="People who have checked out. Spend excludes unpaid and cancelled orders."
      />

      {rows.length === 0 ? (
        <AdminEmptyState>No customers yet.</AdminEmptyState>
      ) : (
        <>
          <AdminListSearch
            value={query}
            onChange={setQuery}
            placeholder="Search by name, email, or phone…"
            countLabel={`${pagination.total} matching · ${rows.length} total`}
          />

          {filtered.length === 0 ? (
            <AdminEmptyState>No customers match your search.</AdminEmptyState>
          ) : (
            <PaginatedTableWrap pagination={pagination.tablePaginationProps("customers")}>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <AdminTableHeaderCell>Name</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Contact</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Orders</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Spent</AdminTableHeaderCell>
                  </tr>
                </AdminTableHead>
                <tbody>
                  {pagination.visible.map((row) => (
                    <AdminTableRow key={row.email}>
                      <AdminTableCell className="font-medium text-deep">{row.name}</AdminTableCell>
                      <AdminTableCell>
                        {row.email}
                        <span className="mt-1 block text-deep/50">{row.phone}</span>
                      </AdminTableCell>
                      <AdminTableCell>{row.orders}</AdminTableCell>
                      <AdminTableCell className="font-medium">{formatNaira(row.spent)}</AdminTableCell>
                    </AdminTableRow>
                  ))}
                </tbody>
              </AdminTable>
            </PaginatedTableWrap>
          )}
        </>
      )}
    </div>
  );
}
