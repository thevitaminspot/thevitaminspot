"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import {
  AdminEmptyState,
  AdminFilterTabs,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { TimeAgo } from "@/components/ui/time-ago";
import {
  fulfillmentLabel,
  isOpenOrder,
  orderQueue,
  type AdminFulfillment,
  type OrderQueue,
} from "@/lib/admin-orders";
import { formatNaira } from "@/lib/money";

export type AdminOrderRow = {
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

function orderSearchText(row: AdminOrderRow) {
  return `${row.orderNumber} ${row.name} ${row.email} ${row.fulfillment} ${row.status}`;
}

function asFulfillment(value: string): AdminFulfillment {
  return value === "PICKUP" ? "PICKUP" : "DELIVERY";
}

export function AdminOrders({ rows }: { rows: AdminOrderRow[] }) {
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<OrderQueue>(() =>
    rows.some((row) => isOpenOrder(row.status)) ? "open" : "all",
  );

  const counts = useMemo(() => {
    const next = { open: 0, fulfilled: 0, cancelled: 0, all: rows.length };
    for (const row of rows) next[orderQueue(row.status)] += 1;
    return next;
  }, [rows]);

  const visible = useMemo(() => {
    const inQueue =
      queue === "all" ? rows : rows.filter((row) => orderQueue(row.status) === queue);
    return filterByQuery(inQueue, query, orderSearchText);
  }, [rows, queue, query]);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search order number, customer, or email"
        countLabel={`${visible.length} of ${rows.length}`}
        className="mb-4"
      />
      <AdminFilterTabs
        value={queue}
        onChange={(id) => setQueue(id as OrderQueue)}
        tabs={[
          { id: "open", label: "Open", count: counts.open },
          { id: "fulfilled", label: "Fulfilled", count: counts.fulfilled },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
          { id: "all", label: "All", count: counts.all },
        ]}
      />

      {visible.length === 0 ? (
        <AdminEmptyState>
          {rows.length === 0
            ? "Paid orders will show up here."
            : "No orders in this view."}
        </AdminEmptyState>
      ) : (
        <AdminTableWrap>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Order</AdminTableHeaderCell>
                <AdminTableHeaderCell>Date</AdminTableHeaderCell>
                <AdminTableHeaderCell>Customer</AdminTableHeaderCell>
                <AdminTableHeaderCell>Fulfillment</AdminTableHeaderCell>
                <AdminTableHeaderCell>Total</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {visible.map((row) => {
                const createdAt =
                  row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                const fulfillment = asFulfillment(row.fulfillment);
                const itemCount = row.items?.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <AdminTableRow key={row.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="font-medium text-deep underline decoration-deep/20 underline-offset-2 hover:decoration-deep"
                      >
                        {row.orderNumber}
                      </Link>
                      <span className="mt-1 block text-[11px] text-deep/45">
                        {itemCount == null
                          ? fulfillment === "PICKUP"
                            ? "Pickup"
                            : "Delivery"
                          : `${itemCount} ${itemCount === 1 ? "item" : "items"} · ${
                              fulfillment === "PICKUP" ? "Pickup" : "Delivery"
                            }`}
                      </span>
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
                      <span className="font-medium text-deep">{row.name}</span>
                      <span className="mt-1 block text-deep/50">{row.email}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge
                        status={row.status}
                        label={fulfillmentLabel(row.status, fulfillment)}
                      />
                    </AdminTableCell>
                    <AdminTableCell className="font-medium">{formatNaira(row.total)}</AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
          </AdminTable>
        </AdminTableWrap>
      )}
    </div>
  );
}

export function AdminOrderListItem({ order }: { order: AdminOrderRow }) {
  const createdAt =
    order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  const fulfillment = asFulfillment(order.fulfillment);

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
        <AdminStatusBadge status={order.status} label={fulfillmentLabel(order.status, fulfillment)} />
        <span className="mt-2 block text-sm text-deep/55">{formatNaira(order.total)}</span>
      </span>
    </Link>
  );
}
