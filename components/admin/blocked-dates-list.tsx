"use client";

import { useMemo, useState, useTransition } from "react";
import { unblockDate } from "@/actions/admin";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { AdminEmptyState } from "@/components/admin/ui";
import { adminButtonDanger } from "@/components/ui/form-styles";
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
  const [localRows, setLocalRows] = useState(rows);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => filterByQuery(localRows, query, blockedDateSearchText),
    [localRows, query],
  );
  const pagination = usePaginatedList(filtered, query);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by date or reason…"
        countLabel={`${pagination.total} matching · ${localRows.length} total`}
        className="mb-4"
      />

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

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
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm text-deep/75"
              >
                <span>
                  {new Date(row.date).toLocaleDateString("en-NG", blockedDateFormat)}
                  {row.reason ? <span className="text-deep/45"> · {row.reason}</span> : null}
                </span>
                <button
                  type="button"
                  disabled={pending && pendingId === row.id}
                  className={adminButtonDanger}
                  onClick={() => {
                    setError(null);
                    setPendingId(row.id);
                    startTransition(async () => {
                      const result = await unblockDate(row.id);
                      setPendingId(null);
                      if ("error" in result) {
                        setError(result.error);
                        return;
                      }
                      setLocalRows((prev) => prev.filter((item) => item.id !== row.id));
                    });
                  }}
                >
                  {pending && pendingId === row.id ? "Removing…" : "Unblock"}
                </button>
              </li>
            ))}
          </ul>
        </PaginatedTableWrap>
      )}
    </div>
  );
}
