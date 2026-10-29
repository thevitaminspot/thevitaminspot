import Link from "next/link";
import { ClearCartOnPaid } from "@/components/shop/clear-cart-on-paid";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { OrderPaymentActions } from "@/components/shop/order-payment-actions";
import { PaystackReturnCleanup } from "@/components/ui/paystack-return-cleanup";
import { RefreshWhilePending } from "@/components/ui/refresh-while-pending";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";
import { confirmPaystackReturn } from "@/lib/payments";
import { site } from "@/lib/site";
import { pageNarrow, pageShell, surfaceMuted } from "@/components/ui/layout-styles";

export const metadata = { title: "Order", robots: { index: false, follow: false } };
export const instant = false;

function orderHeadline(status: string, paid: boolean, fulfillment: string) {
  if (status === "CANCELLED") return "This order was cancelled";
  if (status === "DELIVERED") {
    return fulfillment === "PICKUP" ? "Picked up" : "Delivered";
  }
  if (status === "OUT_FOR_DELIVERY") return "On the way";
  if (status === "PACKED") {
    return fulfillment === "PICKUP" ? "Ready for pickup" : "Packed";
  }
  if (paid || status === "PAID") return "Payment received";
  return "Waiting for payment";
}

function orderNextStep(status: string, paid: boolean, fulfillment: string) {
  if (status === "CANCELLED") return "If this looks wrong, reply to your order email or WhatsApp us.";
  if (status === "DELIVERED") return "Thanks for shopping with us.";
  if (status === "OUT_FOR_DELIVERY") return "Keep your phone nearby in case the courier calls.";
  if (status === "PACKED" && fulfillment === "PICKUP") {
    return `Collect at ${site.address.label}. Bring your order number.`;
  }
  if (status === "PACKED") return "We’ll email you when it leaves the shop.";
  if (paid || status === "PAID") {
    return fulfillment === "PICKUP"
      ? "We’re packing it. You’ll get an email when it’s ready to collect."
      : "We’re packing it. You’ll get an email when it ships.";
  }
  return "Finish payment below. Your bag is saved on this order.";
}

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const reference = typeof query.reference === "string" ? query.reference : query.trxref;
  const paymentCancelled = query.payment === "cancelled";
  const paystackReturn = await confirmPaystackReturn(
    typeof reference === "string" ? reference : undefined,
    { orderToken: token },
  );
  const prisma = await tryPrisma();
  const order = prisma
    ? await prisma.order.findUnique({
        where: { accessToken: token },
        include: { items: true, deliveryZone: true, payment: true },
      })
    : null;

  if (!order) {
    return (
      <main className={`${pageNarrow} ${pageShell} text-center`}>
        <h1 className="font-display text-4xl">We can’t find that order.</h1>
        <p className="mt-3 text-sm text-deep/60">Check the link from your email, or start again from the shop.</p>
        <Link href="/shop" className="mt-6 inline-flex text-sm font-medium text-deep underline underline-offset-2">
          Back to shop
        </Link>
      </main>
    );
  }

  const paid = order.payment?.status === "PAID" || order.status === "PAID" ||
    ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
  const awaitingPay = !paid && order.status !== "CANCELLED";
  const confirming = awaitingPay && !paymentCancelled && paystackReturn.outcome === "pending";
  const paymentNotCompleted =
    awaitingPay &&
    (paymentCancelled ||
      (typeof reference === "string" && paystackReturn.outcome === "failed"));
  const clearPaystackQuery =
    typeof reference === "string" && paystackReturn.outcome !== "pending";

  return (
    <main className={`${pageNarrow} ${pageShell}`}>
      {paid ? <ClearCartOnPaid /> : null}
      <PaystackReturnCleanup active={clearPaystackQuery} />
      <RefreshWhilePending active={confirming} />

      <p className="text-[11px] tracking-[0.28em] text-sage uppercase">{order.orderNumber}</p>
      <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
        {orderHeadline(order.status, paid, order.fulfillment)}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-deep/70">
        {orderNextStep(order.status, paid, order.fulfillment)}
      </p>
      {paid && order.status !== "CANCELLED" ? (
        <OrderTimeline status={order.status} fulfillment={order.fulfillment} />
      ) : null}

      {confirming ? (
        <p className={`${surfaceMuted} mt-4 px-4 py-3 text-sm text-deep/70`}>
          Checking your payment… this page will update on its own.
        </p>
      ) : null}
      {paymentNotCompleted ? (
        <p className={`${surfaceMuted} mt-4 px-4 py-3 text-sm text-deep/70`}>
          {paymentCancelled
            ? "Payment was cancelled. You can try again below."
            : "Payment was not completed. You can try again below."}
        </p>
      ) : null}

      <dl className="mt-8 space-y-2 text-sm text-deep/70">
        <div className="flex justify-between gap-4">
          <dt>How you’ll get it</dt>
          <dd className="text-right font-medium text-deep">
            {order.fulfillment === "PICKUP"
              ? "Shop pickup"
              : order.deliveryZone?.name ?? "Abuja delivery"}
          </dd>
        </div>
        {order.fulfillment === "DELIVERY" && order.addressLine1 ? (
          <div className="flex justify-between gap-4">
            <dt>Address</dt>
            <dd className="max-w-[16rem] text-right text-deep">
              {order.addressLine1}
              {order.city ? `, ${order.city}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-8 space-y-3 border-t border-deep/10 pt-6">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatNaira(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-right text-sage">Total {formatNaira(order.total)}</p>

      <OrderPaymentActions
        token={token}
        orderStatus={order.status}
        paymentStatus={order.payment?.status}
        confirming={confirming}
      />

      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/shop" className="font-medium text-deep underline-offset-2 hover:underline">
          Keep shopping
        </Link>
        <a
          href={`https://wa.me/${site.whatsapp}`}
          className="text-deep/70 underline-offset-2 hover:underline"
        >
          WhatsApp us
        </a>
      </div>
    </main>
  );
}
