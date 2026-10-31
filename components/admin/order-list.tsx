"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { AdminEmptyState, AdminFilterTabs, AdminStatusBadge } from "@/components/admin/ui";
import { OrderNextButton } from "@/components/admin/order-next-button";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { TimeAgo } from "@/components/ui/time-ago";
import { formatLagos } from "@/lib/datetime";
import {
  fulfillmentLabel,
  orderQueue,
  type AdminFulfillment,
  type OrderQueue,
} from "@/lib/admin-orders";
import { usePaginatedList } from "@/hooks/use-paginated-list";
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
  phone?: string;
  notes?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  deliveryFee?: number;
  deliveryZone?: { name: string } | null;
  payment?: { status: string } | null;
  items?: { name?: string; quantity: number; unitPrice?: number }[];
};

function orderSearchText(row: AdminOrderRow) {
  return `${row.orderNumber} ${row.name} ${row.email} ${row.fulfillment} ${row.status}`;
}

function asFulfillment(value: string): AdminFulfillment {
  return value === "PICKUP" ? "PICKUP" : "DELIVERY";
}

export function AdminOrders({ rows }: { rows: AdminOrderRow[] }) {
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<OrderQueue>("all");

  const counts = useMemo(() => {
    const next = {
      confirmed: 0,
      packed: 0,
      sent: 0,
      delivered: 0,
      cancelled: 0,
      all: rows.length,
    };
    for (const row of rows) next[orderQueue(row.status)] += 1;
    return next;
  }, [rows]);

  const visible = useMemo(() => {
    const inQueue =
      queue === "all" ? rows : rows.filter((row) => orderQueue(row.status) === queue);
    return filterByQuery(inQueue, query, orderSearchText);
  }, [rows, queue, query]);

  const pagination = usePaginatedList(visible, `${queue}:${query}`);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search order number, customer, or email"
        countLabel={`${pagination.total} matching · ${rows.length} total`}
        className="mb-4"
      />
      <AdminFilterTabs
        value={queue}
        onChange={(id) => setQueue(id as OrderQueue)}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "confirmed", label: "Confirmed", count: counts.confirmed },
          { id: "packed", label: "Packed", count: counts.packed },
          { id: "sent", label: "On the way", count: counts.sent },
          { id: "delivered", label: "Delivered", count: counts.delivered },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
      />

      {visible.length === 0 ? (
        <AdminEmptyState>
          {rows.length === 0
            ? "Paid orders will show up here."
            : "No orders in this view."}
        </AdminEmptyState>
      ) : (
        <PaginatedTableWrap pagination={pagination.tablePaginationProps("orders")} scroll={false}>
            <ul className="divide-y divide-deep/8">
              {pagination.visible.map((row) => {
                const createdAt =
                  row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                const fulfillment = asFulfillment(row.fulfillment);
                const address = [row.addressLine1, row.city].filter(Boolean).join(", ");

                return (
                  <li key={row.id} className="px-5 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/admin/orders/detail?id=${row.id}`}
                        className="font-medium text-deep underline decoration-deep/20 underline-offset-2 hover:decoration-deep"
                      >
                        {row.orderNumber}
                      </Link>
                      <p className="font-display text-2xl text-deep">{formatNaira(row.total)}</p>
                    </div>
                    <p className="mt-2 text-sm text-deep/75">
                      {row.name || "Guest"} · {row.email}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </p>
                    {address ? <p className="mt-1 text-sm text-deep/50">{address}</p> : null}
                    {fulfillment === "PICKUP" ? (
                      <p className="mt-1 text-sm text-deep/50">Shop pickup</p>
                    ) : row.deliveryZone ? (
                      <p className="mt-1 text-sm text-deep/50">
                        Delivery: {row.deliveryZone.name}
                        {row.deliveryFee ? ` · ${formatNaira(row.deliveryFee)}` : ""}
                      </p>
                    ) : null}
                    {row.notes?.trim() ? (
                      <p className="mt-1 text-sm text-deep/60">Notes: {row.notes.trim()}</p>
                    ) : null}
                    {row.items && row.items.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-deep/60">
                        {row.items.map((item, index) => (
                          <li key={`${row.id}-${index}`}>
                            {item.quantity}× {item.name ?? "Item"}
                            {item.unitPrice != null ? ` · ${formatNaira(item.unitPrice)}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <AdminStatusBadge
                        status={row.status}
                        label={fulfillmentLabel(row.status, fulfillment)}
                      />
                      <p className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">
                        <TimeAgo value={createdAt} />
                        <span className="mx-1.5 text-deep/20">·</span>
                        {formatLagos(createdAt, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <OrderNextButton
                        id={row.id}
                        status={row.status}
                        fulfillment={row.fulfillment}
                      />
                      <OrderStatusSelect
                        id={row.id}
                        status={row.status}
                        fulfillment={row.fulfillment}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
        </PaginatedTableWrap>
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
      href={`/admin/orders/detail?id=${order.id}`}
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
