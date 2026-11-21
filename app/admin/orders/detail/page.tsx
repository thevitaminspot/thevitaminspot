import Link from "next/link";
import { Suspense } from "react";
import { formatLagos } from "@/lib/datetime";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  User,
} from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import {
  AdminBackLink,
  AdminDetailCard,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { fulfillmentLabel } from "@/lib/admin-orders";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { RoutePlaceholder } from "@/components/ui/route-placeholder";
import { TimeAgo } from "@/components/ui/time-ago";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Order Details · Admin" };
export const instant = false;

function cleanWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "234" + digits.slice(1);
  }
  if (digits.startsWith("234")) {
    return digits;
  }
  return digits;
}

export default function AdminOrderDetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<RoutePlaceholder />}>
      <AdminOrderDetail searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminOrderDetail({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const raw = query.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!id) notFound();

  const prisma = await tryPrisma();
  if (!prisma) return <p>Connect Neon to open orders.</p>;

  let order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true, deliveryZone: true },
  });
  if (!order) notFound();

  if (order.payment?.status === "PAID" && order.status === "PENDING") {
    order = await prisma.order.update({
      where: { id },
      data: { status: "PAID" },
      include: { items: true, payment: true, deliveryZone: true },
    });
  }

  const waPhone = cleanWaPhone(order.phone);
  const waMessage = encodeURIComponent(
    `Hello ${order.name}, this is The Vitamin Spot Maitama concierge regarding your order ${order.orderNumber}. We are preparing your items for delivery. Please let us know if you have any specific courier notes.`,
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <div className="space-y-8">
      <AdminBackLink href="/admin/orders" label="All orders" />

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-deep/8 pb-7">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-sage uppercase">Shop</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-deep md:text-4xl">{order.orderNumber}</h1>
            <AdminStatusBadge
              status={order.status}
              label={fulfillmentLabel(
                order.status,
                order.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY",
              )}
            />
          </div>
          <p className="mt-2 text-sm text-deep/55">
            Placed <TimeAgo value={order.createdAt} /> ·{" "}
            {formatLagos(order.createdAt)} · {order.fulfillment}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] tracking-[0.16em] text-deep/45 uppercase">Total</p>
          <p className="font-display text-3xl text-deep md:text-4xl">{formatNaira(order.total)}</p>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 space-y-6">
          <AdminDetailCard title="Items in order" icon={<Package className="size-4" />}>
            <ul className="mt-4 divide-y divide-deep/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-deep">{item.name}</p>
                    <p className="mt-0.5 text-xs text-deep/50">
                      Quantity: {item.quantity} × {formatNaira(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium text-deep">
                    {formatNaira(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-deep/10 pt-4 text-xs text-deep/70">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-deep">{formatNaira(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery Fee ({order.deliveryZone?.name ?? "Abuja"})</dt>
                <dd className="font-medium text-deep">{formatNaira(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-deep/10 pt-2 text-sm font-semibold text-deep">
                <dt>Grand Total</dt>
                <dd>{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </AdminDetailCard>

          <section className="min-w-0 rounded-2xl border border-deep/10 bg-cream/30 p-5">
            <p className="text-xs font-medium text-deep/70">Customer Public Tracking Link</p>
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-deep/10 bg-white p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <p className="min-w-0 break-all font-mono text-xs leading-relaxed text-deep/70">
                /orders/{order.accessToken}
              </p>
              <Link
                href={`/orders/${order.accessToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-semibold text-deep hover:text-sage"
              >
                <span>Open View</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <AdminDetailCard title="Fulfillment">
            <OrderActions
              id={order.id}
              status={order.status}
              paymentStatus={order.payment?.status}
              fulfillment={order.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY"}
            />
          </AdminDetailCard>

          <AdminDetailCard title="Customer" icon={<User className="size-4" />}>
            <div className="mt-4 space-y-2 text-xs leading-relaxed text-deep/80">
              <p className="text-sm font-semibold text-deep">{order.name}</p>
              <p className="break-all text-deep/70">{order.email}</p>
              <p className="break-all text-deep/70">{order.phone}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-deep/10 pt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-deep p-2.5 text-center text-[10px] font-medium text-cream transition hover:bg-deep-hover"
              >
                <MessageCircle className="size-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${order.phone}`}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-deep/15 bg-cream/30 p-2.5 text-center text-[10px] font-medium text-deep transition hover:bg-tint"
              >
                <Phone className="size-4" />
                <span>Call</span>
              </a>

              <a
                href={`mailto:${order.email}?subject=The%20Vitamin%20Spot%20Order%20${order.orderNumber}`}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-deep/15 bg-cream/30 p-2.5 text-center text-[10px] font-medium text-deep transition hover:bg-tint"
              >
                <Mail className="size-4" />
                <span>Email</span>
              </a>
            </div>

            <div className="mt-5 border-t border-deep/10 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-deep">
                <MapPin className="size-3.5 text-sage" />
                <span>
                  {order.fulfillment === "DELIVERY" ? "Delivery Address" : "Shop pickup"}
                </span>
              </div>

              {order.fulfillment === "DELIVERY" ? (
                <div className="mt-2 text-xs leading-relaxed text-deep/70">
                  <p>{order.addressLine1}</p>
                  {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
                  <p>
                    {order.city}
                    {order.deliveryZone ? ` · Zone: ${order.deliveryZone.name}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-deep/70">
                  Client will collect in person at the shop.
                </p>
              )}

              {order.notes ? (
                <div className="mt-3 rounded-lg bg-tint/40 p-3 text-xs text-deep/70">
                  <span className="font-semibold text-deep">Courier Notes: </span>
                  {order.notes}
                </div>
              ) : null}
            </div>
          </AdminDetailCard>
        </div>
      </div>
    </div>
  );
}
