"use client";

import { useMemo, useState } from "react";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { AdminEmptyState, AdminMessageCard } from "@/components/admin/ui";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatLagos } from "@/lib/datetime";

export type MessageRow = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

function messageSearchText(row: MessageRow) {
  return `${row.name} ${row.email} ${row.phone ?? ""} ${row.message}`;
}

export function AdminMessageList({ rows }: { rows: MessageRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterByQuery(rows, query, messageSearchText),
    [rows, query],
  );
  const pagination = usePaginatedList(filtered, query);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by name, email, or message…"
        countLabel={`${pagination.total} matching · ${rows.length} total`}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No messages match your search." : "No messages yet."}
        </AdminEmptyState>
      ) : (
        <PaginatedTableWrap
          pagination={pagination.tablePaginationProps("messages")}
          scroll={false}
        >
          <ul className="divide-y divide-deep/6">
            {pagination.visible.map((row) => (
              <li key={row.id} className="px-5 py-4">
                <AdminMessageCard
                  meta={`${formatLagos(row.createdAt)} · ${row.name} · ${row.email}${
                    row.phone ? ` · ${row.phone}` : ""
                  }`}
                >
                  {row.message}
                </AdminMessageCard>
              </li>
            ))}
          </ul>
        </PaginatedTableWrap>
      )}
    </div>
  );
}
