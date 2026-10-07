import { OrderPaymentActions } from "@/components/shop/order-payment-actions";
import { tryPrisma } from "@/lib/db";
import { formatNaira } from "@/lib/money";
import { confirmPaystackReturn } from "@/lib/payments";

export const metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const reference = typeof query.reference === "string" ? query.reference : query.trxref;
  await confirmPaystackReturn(typeof reference === "string" ? reference : undefined);
  const prisma = await tryPrisma();
  const order = prisma
    ? await prisma.order.findUnique({
        where: { accessToken: token },
        include: { items: true, deliveryZone: true, payment: true },
      })
    : null;

  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">We can’t find that order.</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-sage uppercase">{order.status}</p>
      <h1 className="font-display mt-3 text-5xl">{order.orderNumber}</h1>
      <p className="mt-5 text-deep/70">
        {order.fulfillment === "PICKUP" ? "Pickup in Abuja" : order.deliveryZone?.name}
      </p>
      <ul className="mt-8 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatNaira(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sage">Total {formatNaira(order.total)}</p>
      <OrderPaymentActions
        token={token}
        orderStatus={order.status}
        paymentStatus={order.payment?.status}
      />
    </main>
  );
}
