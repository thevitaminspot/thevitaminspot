import Link from "next/link";
import { Suspense } from "react";
import { AccountPaginationBars } from "@/components/account/account-pagination";
import { AccountBookingsTable } from "@/components/account/booking-card";
import {
  AccountLoadingFallback,
  AccountSignInPrompt,
} from "@/components/account/account-sign-in";
import { getSessionProfile } from "@/lib/auth";
import { tryPrisma } from "@/lib/db";
import { hasClerk } from "@/lib/env";
import { PAGE_SIZE, clampPage, parsePageParam, totalPages } from "@/lib/pagination";
import { pageAuth, pageShell, pageWide, surface } from "@/components/ui/layout-styles";

export const metadata = { title: "My bookings", robots: { index: false, follow: false } };
export const instant = false;
export const prefetch = "force-disabled";

export default function AccountBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<AccountLoadingFallback title="My bookings" />}>
      <BookingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BookingsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!hasClerk()) {
    return (
      <main className={`${pageAuth} ${pageShell} text-center`}>
        <h1 className="font-display text-5xl">My bookings</h1>
        <p className="mt-4 text-deep/70">
          Sign-in uses Clerk. Add the keys, then your drip bookings will collect here. Guest booking
          still works.
        </p>
      </main>
    );
  }

  const profile = await getSessionProfile();
  if (!profile) {
    return (
      <AccountSignInPrompt
        title="My bookings"
        lede="Sign in to see your drip bookings."
      />
    );
  }

  const params = await searchParams;
  const pageRaw = parsePageParam(params.page);
  const prisma = await tryPrisma();

  const data = prisma
    ? await (async () => {
        const bookingsTotal = await prisma.appointment.count({
          where: { email: profile.email },
        });
        const pages = totalPages(bookingsTotal);
        const page = clampPage(pageRaw, pages);
        const appointments = await prisma.appointment.findMany({
          where: { email: profile.email },
          include: { service: true },
          orderBy: { startsAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        });
        return { appointments, bookingsTotal, page };
      })()
    : { appointments: [], bookingsTotal: 0, page: 1 };

  const pages = totalPages(data.bookingsTotal);

  return (
    <main className={`${pageWide} ${pageShell}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-deep/45 uppercase">Account</p>
          <h1 className="mt-2 font-display text-5xl">My bookings</h1>
          <p className="mt-2 text-sm text-deep/60">
            {data.bookingsTotal} {data.bookingsTotal === 1 ? "session" : "sessions"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-deep">
          <Link href="/account/orders" className="underline-offset-2 hover:underline">
            My orders
          </Link>
          <Link href="/infusions" className="underline-offset-2 hover:underline">
            Book a drip
          </Link>
        </div>
      </div>

      <div className={`mt-10 overflow-hidden ${surface}`}>
        {data.appointments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-deep/50">No bookings yet.</p>
            <Link
              href="/infusions"
              className="mt-4 inline-flex text-xs font-medium text-deep underline-offset-2 hover:underline"
            >
              Book a drip
            </Link>
          </div>
        ) : (
          <AccountPaginationBars
            basePath="/account/bookings"
            page={data.page}
            totalPages={pages}
            totalItems={data.bookingsTotal}
            pageSize={PAGE_SIZE}
            itemLabel="bookings"
          >
            <AccountBookingsTable bookings={data.appointments} />
          </AccountPaginationBars>
        )}
      </div>
    </main>
  );
}
