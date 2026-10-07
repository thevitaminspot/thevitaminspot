"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import {
  AdminEmptyState,
  AdminSection,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";
import { TimeAgo } from "@/components/ui/time-ago";
import { formatNaira } from "@/lib/money";

type OrderRow = {
  id: string;
  orderNumber: string;
  name: string;
  email: string;
  fulfillment: string;
  total: number;
  status: string;
  createdAt: Date | string;
  payment?: { status: string } | null;
  items?: { quantity: number }[];
};

function orderSearchText(row: OrderRow) {
  const payment = row.payment?.status ?? "";
  return `${row.orderNumber} ${row.name} ${row.email} ${row.fulfillment} ${row.status} ${payment}`;
}

function OrderTable({
  rows,
  footer,
}: {
  rows: OrderRow[];
  footer?: ReactNode;
}) {
  return (
    <AdminTableWrap footer={footer}>
      <AdminTable>
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>Order</AdminTableHeaderCell>
            <AdminTableHeaderCell>Customer</AdminTableHeaderCell>
            <AdminTableHeaderCell>Placed</AdminTableHeaderCell>
            <AdminTableHeaderCell>Items</AdminTableHeaderCell>
            <AdminTableHeaderCell>Total</AdminTableHeaderCell>
            <AdminTableHeaderCell>Payment</AdminTableHeaderCell>
            <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          </tr>
        </AdminTableHead>
        <tbody>
          {rows.map((row) => {
            const createdAt =
              row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);

            return (
              <AdminTableRow key={row.id}>
                <AdminTableCell>
                  <Link
                    href={`/admin/orders/${row.id}`}
                    className="font-medium text-deep underline decoration-deep/20 underline-offset-2 hover:decoration-deep/50"
                  >
                    {row.orderNumber}
                  </Link>
                  <span className="mt-1 block text-[11px] tracking-[0.1em] text-deep/45 uppercase">
                    {row.fulfillment}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-medium text-deep">{row.name}</span>
                  <span className="mt-1 block text-deep/50">{row.email}</span>
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap">
                  <TimeAgo value={createdAt} className="text-deep/75" />
                  <span className="mt-1 block text-[11px] text-deep/40">
                    {createdAt.toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  {row.items?.reduce((sum, item) => sum + item.quantity, 0) ?? "—"}
                </AdminTableCell>
                <AdminTableCell className="font-medium">{formatNaira(row.total)}</AdminTableCell>
                <AdminTableCell>
                  {row.payment?.status ? (
                    <AdminStatusBadge status={row.payment.status} />
                  ) : (
                    <span className="text-deep/35">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={row.status} />
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </tbody>
      </AdminTable>
    </AdminTableWrap>
  );
}

function OrderGroupSection({
  title,
  description,
  rows,
  uncapped = false,
  label,
  resetKey,
}: {
  title: string;
  description: string;
  rows: OrderRow[];
  uncapped?: boolean;
  label?: string;
  resetKey?: string;
}) {
  const list = useCollapsibleList(rows, { uncapped, resetKey });

  if (rows.length === 0) return null;

  const footer = list.collapsible ? (
    <AdminShowMoreFooter
      expanded={list.expanded}
      total={list.total}
      hiddenCount={list.hiddenCount}
      label={label}
      onToggle={() => list.setExpanded((value) => !value)}
    />
  ) : null;

  return (
    <AdminSection title={`${title} · ${rows.length}`}>
      <p className="mb-3 text-sm text-deep/55">{description}</p>
      <OrderTable rows={list.visible} footer={footer} />
    </AdminSection>
  );
}

export function AdminOrderGroups({
  groups,
}: {
  groups: {
    key: string;
    title: string;
    description: string;
    rows: OrderRow[];
    uncapped?: boolean;
    label?: string;
  }[];
}) {
  const [query, setQuery] = useState("");
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          rows: filterByQuery(group.rows, query, orderSearchText),
        }))
        .filter((group) => group.rows.length > 0),
    [groups, query],
  );
  const filteredTotal = filteredGroups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by order number, customer, or status…"
        countLabel={`${filteredTotal} of ${total} orders`}
        className="mb-8"
      />

      {filteredTotal === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No orders match your search." : "No orders yet."}
        </AdminEmptyState>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map((group) => (
            <OrderGroupSection
              key={group.key}
              title={group.title}
              description={group.description}
              rows={group.rows}
              uncapped={group.uncapped}
              label={group.label}
              resetKey={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminOrderListItem({
  order,
}: {
  order: OrderRow;
}) {
  const createdAt =
    order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/30"
    >
      <span className="min-w-0">
        <span className="block font-medium text-deep">{order.orderNumber}</span>
        <span className="mt-0.5 block truncate text-sm text-deep/50">{order.name}</span>
        <TimeAgo value={createdAt} className="mt-1 block text-[11px] text-deep/40" />
      </span>
      <span className="shrink-0 text-right">
        <AdminStatusBadge status={order.status} />
        <span className="mt-2 block text-sm text-deep/55">{formatNaira(order.total)}</span>
      </span>
    </Link>
  );
}
