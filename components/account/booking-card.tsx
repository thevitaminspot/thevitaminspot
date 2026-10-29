import Link from "next/link";
import { AccountStatusBadge } from "@/components/account/account-status-badge";
import { formatLagos } from "@/lib/datetime";

type AccountBooking = {
  accessToken: string;
  status: string;
  startsAt: Date;
  service: { name: string };
};

export function AccountBookingCard({ booking }: { booking: AccountBooking }) {
  return (
    <article className="border-b border-deep/8 px-4 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <AccountStatusBadge status={booking.status} />
          <p className="mt-2 text-sm font-medium text-deep">{booking.service.name}</p>
          <p className="mt-1 text-xs text-deep/55">
            {formatLagos(booking.startsAt, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link
          href={`/appointments/${booking.accessToken}`}
          className="text-xs font-medium text-deep underline-offset-2 hover:underline"
        >
          View
        </Link>
      </div>
    </article>
  );
}
