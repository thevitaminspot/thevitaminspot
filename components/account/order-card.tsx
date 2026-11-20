import Image from "next/image";
import Link from "next/link";
import { AccountStatusBadge } from "@/components/account/account-status-badge";
import { fulfillmentLabel, type AdminFulfillment } from "@/lib/admin-orders";
import { formatLagos } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";

type AccountOrder = {
  accessToken: string;
  orderNumber: string;
  status: string;
  fulfillment: string;
  total: number;
  createdAt: Date;
  deliveryZone: { name: string } | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    product: { images: { url: string; alt: string }[] } | null;
  }[];
};

export function AccountOrdersTable({ orders }: { orders: AccountOrder[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-deep/10 bg-cream/40">
          <tr className="text-[10px] tracking-[0.16em] text-deep/45 uppercase">
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Order
            </th>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Placed
            </th>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Items
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium sm:px-5">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium sm:px-5">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const fulfillment: AdminFulfillment =
              order.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY";
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const preview = order.items[0]?.product?.images[0];
            const where =
              order.fulfillment === "DELIVERY" && order.deliveryZone
                ? order.deliveryZone.name
                : order.fulfillment === "PICKUP"
                  ? "Shop pickup"
                  : null;

            return (
              <tr
                key={order.accessToken}
                className="border-b border-deep/8 last:border-0 hover:bg-cream/30"
              >
                <td className="px-4 py-3.5 align-middle sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-lg border border-deep/10 bg-tint/40 sm:block">
                      {preview ? (
                        <Image
                          src={preview.url}
                          alt={preview.alt || order.items[0]?.name || "Order item"}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-deep">{order.orderNumber}</p>
                      {where ? <p className="mt-0.5 text-xs text-deep/50">{where}</p> : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle whitespace-nowrap text-deep/65 sm:px-5">
                  {formatLagos(order.createdAt, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3.5 align-middle sm:px-5">
                  <AccountStatusBadge
                    status={order.status}
                    label={fulfillmentLabel(order.status, fulfillment)}
                  />
                </td>
                <td className="px-4 py-3.5 align-middle text-deep/65 sm:px-5">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </td>
                <td className="px-4 py-3.5 align-middle text-right font-medium whitespace-nowrap text-deep sm:px-5">
                  {formatNaira(order.total)}
                </td>
                <td className="px-4 py-3.5 align-middle text-right sm:px-5">
                  <Link
                    href={`/orders/${order.accessToken}`}
                    className="inline-flex min-h-9 items-center text-xs font-medium text-deep underline-offset-2 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** @deprecated Prefer AccountOrdersTable */
export function AccountOrderCard({ order }: { order: AccountOrder }) {
  return <AccountOrdersTable orders={[order]} />;
}
