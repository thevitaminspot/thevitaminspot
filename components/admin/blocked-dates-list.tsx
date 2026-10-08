"use client";

import { useMemo, useState } from "react";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { AdminEmptyState } from "@/components/admin/ui";
import { usePaginatedList } from "@/hooks/use-paginated-list";

export type BlockedDateRow = {
  id: string;
  date: string;
  reason: string | null;
};

const blockedDateFormat: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function blockedDateSearchText(row: BlockedDateRow) {
  const formatted = new Date(row.date).toLocaleDateString("en-NG", blockedDateFormat);
  return `${formatted} ${row.reason ?? ""}`;
}

export function AdminBlockedDatesList({ rows }: { rows: BlockedDateRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterByQuery(rows, query, blockedDateSearchText),
    [rows, query],
  );
  const pagination = usePaginatedList(filtered, query);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by date or reason…"
        countLabel={`${pagination.total} matching · ${rows.length} total`}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No blocked dates match your search." : "No blocked dates."}
        </AdminEmptyState>
      ) : (
        <PaginatedTableWrap
          pagination={pagination.tablePaginationProps("blocked dates")}
          scroll={false}
        >
          <ul className="divide-y divide-deep/6">
            {pagination.visible.map((row) => (
              <li key={row.id} className="px-5 py-3.5 text-sm text-deep/75">
                {new Date(row.date).toLocaleDateString("en-NG", blockedDateFormat)}
                {row.reason ? <span className="text-deep/45"> · {row.reason}</span> : null}
              </li>
            ))}
          </ul>
        </PaginatedTableWrap>
      )}
    </div>
  );
}
