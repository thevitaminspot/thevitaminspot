import Link from "next/link";
import { Suspense } from "react";
import { AccountPaginationBars } from "@/components/account/account-pagination";
import { AccountOrdersTable } from "@/components/account/order-card";
import {
  AccountLoadingFallback,
  AccountSignInPrompt,
} from "@/components/account/account-sign-in";
import { getSessionProfile } from "@/lib/auth";
import { tryPrisma } from "@/lib/db";
import { hasClerk } from "@/lib/env";
import { PAGE_SIZE, clampPage, parsePageParam, totalPages } from "@/lib/pagination";
import { pageAuth, pageShell, pageWide, surface } from "@/components/ui/layout-styles";

export const metadata = { title: "My orders", robots: { index: false, follow: false } };
export const instant = false;
export const prefetch = "force-disabled";

const orderWhere = (email: string) => ({
  email,
  payment: { status: "PAID" as const },
});

export default function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<AccountLoadingFallback title="My orders" />}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!hasClerk()) {
    return (
      <main className={`${pageAuth} ${pageShell} text-center`}>
        <h1 className="font-display text-5xl">My orders</h1>
        <p className="mt-4 text-deep/70">
          Sign-in uses Clerk. Add the keys, then your paid orders will collect here. Guest checkout
          still works.
        </p>
      </main>
    );
  }

  const profile = await getSessionProfile();
  if (!profile) {
    return (
      <AccountSignInPrompt
        title="My orders"
        lede="Sign in to see your paid shop orders."
      />
    );
  }

  const params = await searchParams;
  const pageRaw = parsePageParam(params.page);
  const prisma = await tryPrisma();

  const data = prisma
    ? await (async () => {
        const ordersTotal = await prisma.order.count({ where: orderWhere(profile.email) });
        const pages = totalPages(ordersTotal);
        const page = clampPage(pageRaw, pages);
        const orders = await prisma.order.findMany({
          where: orderWhere(profile.email),
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            deliveryZone: true,
            items: {
              include: {
                product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
              },
            },
          },
        });
        return { orders, ordersTotal, page };
      })()
    : { orders: [], ordersTotal: 0, page: 1 };

  const pages = totalPages(data.ordersTotal);

  return (
    <main className={`${pageWide} ${pageShell}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-deep/45 uppercase">Account</p>
          <h1 className="mt-2 font-display text-5xl">My orders</h1>
          <p className="mt-2 text-sm text-deep/60">
            {data.ordersTotal} paid {data.ordersTotal === 1 ? "order" : "orders"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-deep">
          <Link href="/account/bookings" className="underline-offset-2 hover:underline">
            My bookings
          </Link>
          <Link href="/shop" className="underline-offset-2 hover:underline">
            Shop again
          </Link>
        </div>
      </div>

      <div className={`mt-10 overflow-hidden ${surface}`}>
        {data.orders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-deep/50">No orders yet.</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex text-xs font-medium text-deep underline-offset-2 hover:underline"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <AccountPaginationBars
            basePath="/account/orders"
            page={data.page}
            totalPages={pages}
            totalItems={data.ordersTotal}
            pageSize={PAGE_SIZE}
            itemLabel="orders"
          >
            <AccountOrdersTable orders={data.orders} />
          </AccountPaginationBars>
        )}
      </div>
    </main>
  );
}
