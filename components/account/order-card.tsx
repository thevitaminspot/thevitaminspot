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

export function AccountOrderCard({ order }: { order: AccountOrder }) {
  const fulfillment: AdminFulfillment = order.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const previews = order.items.slice(0, 3);

  return (
    <article className="border-b border-deep/8 px-4 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <AccountStatusBadge
            status={order.status}
            label={fulfillmentLabel(order.status, fulfillment)}
          />
          <p className="mt-2 text-sm font-medium text-deep">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-deep/55">
            {formatLagos(order.createdAt, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {itemCount} {itemCount === 1 ? "item" : "items"}
            {order.fulfillment === "DELIVERY" && order.deliveryZone
              ? ` · ${order.deliveryZone.name}`
              : order.fulfillment === "PICKUP"
                ? " · Shop pickup"
                : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-deep">{formatNaira(order.total)}</p>
          <Link
            href={`/orders/${order.accessToken}`}
            className="mt-2 inline-flex text-xs font-medium text-deep underline-offset-2 hover:underline"
          >
            View
          </Link>
        </div>
      </div>
      {previews.length > 0 ? (
        <div className="mt-3 flex gap-2">
          {previews.map((item) => {
            const image = item.product?.images[0];
            return (
              <span
                key={item.id}
                className="relative size-12 overflow-hidden rounded-lg border border-deep/10 bg-tint/40"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.alt || item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
