"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { unblockDate } from "@/actions/admin";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { AdminEmptyState } from "@/components/admin/ui";
import { adminButtonDanger } from "@/components/ui/form-styles";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { withActionError } from "@/lib/server-action-error";

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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const filtered = useMemo(
    () => filterByQuery(localRows, query, blockedDateSearchText),
    [localRows, query],
  );
  const pagination = usePaginatedList(filtered, query);

  if (localRows.length === 0) {
    return <AdminEmptyState>No blocked dates.</AdminEmptyState>;
  }

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by date or reason…"
        countLabel={`${pagination.total} matching · ${localRows.length} total`}
      />

      {filtered.length === 0 ? (
        <AdminEmptyState>No blocked dates match your search.</AdminEmptyState>
      ) : (
        <PaginatedTableWrap
          pagination={pagination.tablePaginationProps("blocked dates")}
          scroll={false}
        >
          <ul className="divide-y divide-deep/8">
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
                    setPendingId(row.id);
                    startTransition(async () => {
                      const result = await withActionError(
                        () => unblockDate(row.id),
                        adminNotifyError,
                        "Could not unblock date.",
                      );
                      setPendingId(null);
                      if (!result) return;
                      if ("error" in result) {
                        adminNotifyError(result.error ?? "Could not unblock date.");
                        return;
                      }
                      adminNotifySuccess("Date unblocked.");
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
