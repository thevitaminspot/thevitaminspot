"use client";

import { useMemo, useState } from "react";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { AdminEmptyState, AdminPanel } from "@/components/admin/ui";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";

export type BlockedDateRow = {
  id: string;
  date: string;
  reason: string | null;
};

function blockedDateSearchText(row: BlockedDateRow) {
  const formatted = new Date(row.date).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${formatted} ${row.reason ?? ""}`;
}

export function AdminBlockedDatesList({ rows }: { rows: BlockedDateRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterByQuery(rows, query, blockedDateSearchText),
    [rows, query],
  );
  const list = useCollapsibleList(filtered, { resetKey: query });

  const footer = list.collapsible ? (
    <AdminShowMoreFooter
      expanded={list.expanded}
      total={list.total}
      hiddenCount={list.hiddenCount}
      label="blocked dates"
      onToggle={() => list.setExpanded((value) => !value)}
    />
  ) : null;

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by date or reason…"
        countLabel={`${filtered.length} of ${rows.length} blocked dates`}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No blocked dates match your search." : "No blocked dates."}
        </AdminEmptyState>
      ) : (
        <AdminPanel>
          <ul className="divide-y divide-deep/6">
            {list.visible.map((row) => (
              <li key={row.id} className="px-5 py-3.5 text-sm text-deep/75">
                {new Date(row.date).toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {row.reason ? <span className="text-deep/45"> · {row.reason}</span> : null}
              </li>
            ))}
          </ul>
          {footer}
        </AdminPanel>
      )}
    </div>
  );
}
