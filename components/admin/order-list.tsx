import Link from "next/link";
import {
  AdminSection,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { formatNaira } from "@/lib/money";
import { formatTimeAgo } from "@/lib/time-ago";

type OrderRow = {
  id: string;
  orderNumber: string;
  name: string;
  email: string;
  fulfillment: string;
  total: number;
  status: string;
  createdAt: Date;
  payment?: { status: string } | null;
  items?: { quantity: number }[];
};

function OrderTable({ rows }: { rows: OrderRow[] }) {
  return (
    <AdminTableWrap>
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
          {rows.map((row) => (
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
                <span className="text-deep/75">{formatTimeAgo(row.createdAt)}</span>
                <span className="mt-1 block text-[11px] text-deep/40">
                  {row.createdAt.toLocaleString("en-NG", {
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
          ))}
        </tbody>
      </AdminTable>
    </AdminTableWrap>
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
  }[];
}) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <AdminSection
          key={group.key}
          title={`${group.title} · ${group.rows.length}`}
        >
          <p className="mb-3 text-sm text-deep/55">{group.description}</p>
          <OrderTable rows={group.rows} />
        </AdminSection>
      ))}
    </div>
  );
}

export function AdminOrderListItem({
  order,
}: {
  order: OrderRow;
}) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/30"
    >
      <span className="min-w-0">
        <span className="block font-medium text-deep">{order.orderNumber}</span>
        <span className="mt-0.5 block truncate text-sm text-deep/50">{order.name}</span>
        <span className="mt-1 block text-[11px] text-deep/40">{formatTimeAgo(order.createdAt)}</span>
      </span>
      <span className="shrink-0 text-right">
        <AdminStatusBadge status={order.status} />
        <span className="mt-2 block text-sm text-deep/55">{formatNaira(order.total)}</span>
      </span>
    </Link>
  );
}
