"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";
import { adminFormSearch } from "@/components/ui/form-styles";
import { formatNaira } from "@/lib/money";

export type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
};

export function AdminCustomerList({ rows }: { rows: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const list = useCollapsibleList(filtered, { resetKey: query });

  const footer = list.collapsible ? (
    <AdminShowMoreFooter
      expanded={list.expanded}
      total={list.total}
      hiddenCount={list.hiddenCount}
      label="customers"
      onToggle={() => list.setExpanded((value) => !value)}
    />
  ) : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Customers"
        description="People who have checked out. Spend excludes unpaid and cancelled orders."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">
          {filtered.length} of {rows.length} customers
        </p>
        <div className="relative min-w-[220px] sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-deep/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or phone…"
            className={adminFormSearch}
          />
        </div>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <AdminEmptyState>
            {query.trim() ? "No customers match your search." : "No customers yet."}
          </AdminEmptyState>
        ) : (
          <AdminTableWrap footer={footer}>
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
                {list.visible.map((row) => (
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
          </AdminTableWrap>
        )}
      </div>
    </div>
  );
}
