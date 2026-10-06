import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Order Details · Admin" };

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

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-medium text-deep/60 hover:text-deep"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-deep/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-deep md:text-4xl">{order.orderNumber}</h1>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                order.status === "DELIVERED"
                  ? "bg-green-100 text-green-800"
                  : order.status === "OUT_FOR_DELIVERY"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "PACKED"
                      ? "bg-purple-100 text-purple-800"
                      : order.status === "PAID"
                        ? "bg-sage/30 text-deep"
                        : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-deep/60">
            Placed on {order.createdAt.toLocaleString("en-NG")} · {order.fulfillment}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-deep/50 uppercase tracking-wider">Total Value</p>
          <p className="font-display text-3xl text-deep md:text-4xl">{formatNaira(order.total)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Order Items */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-sage" />
              <h2 className="font-display text-lg text-deep">Items in Order</h2>
            </div>

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
          </section>

          {/* Customer Order Tracking Link */}
          <section className="rounded-2xl border border-deep/10 bg-tint/30 p-5">
            <p className="text-xs font-medium text-deep/70">Customer Public Tracking Link</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-deep/10 bg-white p-3">
              <span className="truncate text-xs text-deep/70">
                /orders/{order.accessToken}
              </span>
              <Link
                href={`/orders/${order.accessToken}`}
                target="_blank"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-deep hover:text-sage"
              >
                <span>Open View</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: Fulfillment, Contact, & Status Controls */}
        <div className="space-y-6">
          {/* Status Pipeline & Controls */}
          <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] text-sage uppercase">
              Fulfillment Pipeline
            </h2>
            <div className="mt-4">
              <OrderActions
                id={order.id}
                status={order.status}
                paymentStatus={order.payment?.status}
              />
            </div>

            <div className="mt-5 rounded-xl border border-deep/10 bg-cream/40 p-4 text-xs text-deep/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-sage" />
                <span className="font-medium text-deep">
                  Paystack Status: {order.payment?.status ?? "Unpaid"}
                </span>
              </div>
              {order.payment?.paystackReference ? (
                <p className="mt-1 font-mono text-[11px] text-deep/60">
                  Ref: {order.payment.paystackReference}
                </p>
              ) : null}
            </div>
          </section>

          {/* Customer Contact Card */}
          <section className="rounded-2xl border border-deep/10 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <User className="size-4 text-sage" />
              <h2 className="font-display text-lg text-deep">Customer Details</h2>
            </div>

            <div className="mt-4 space-y-2 text-xs leading-relaxed text-deep/80">
              <p className="text-sm font-semibold text-deep">{order.name}</p>
              <p className="text-deep/70">{order.email}</p>
              <p className="text-deep/70">{order.phone}</p>
            </div>

            {/* Quick Contact Buttons */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-deep/10 pt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600 p-2.5 text-center text-[10px] font-medium text-white transition hover:bg-emerald-700"
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

            {/* Address */}
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
          </section>
        </div>
      </div>
    </div>
  );
}
