"use client";

import { useMemo, useState } from "react";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { AdminEmptyState, AdminMessageCard } from "@/components/admin/ui";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";

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
  const list = useCollapsibleList(filtered, { resetKey: query });

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by name, email, or message…"
        countLabel={`${filtered.length} of ${rows.length} messages`}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No messages match your search." : "No messages yet."}
        </AdminEmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {list.visible.map((row) => (
              <li key={row.id}>
                <AdminMessageCard
                  meta={`${new Date(row.createdAt).toLocaleString("en-NG")} · ${row.name} · ${row.email}${
                    row.phone ? ` · ${row.phone}` : ""
                  }`}
                >
                  {row.message}
                </AdminMessageCard>
              </li>
            ))}
          </ul>
          {list.collapsible ? (
            <div className="mt-3">
              <AdminShowMoreFooter
                expanded={list.expanded}
                total={list.total}
                hiddenCount={list.hiddenCount}
                label="messages"
                onToggle={() => list.setExpanded((value) => !value)}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
