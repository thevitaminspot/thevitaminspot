import Link from "next/link";
import { AccountStatusBadge } from "@/components/account/account-status-badge";
import { formatLagos } from "@/lib/datetime";

type AccountBooking = {
  accessToken: string;
  status: string;
  startsAt: Date;
  service: { name: string };
};

export function AccountBookingsTable({ bookings }: { bookings: AccountBooking[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-deep/10 bg-cream/40">
          <tr className="text-[10px] tracking-[0.16em] text-deep/45 uppercase">
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Service
            </th>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium sm:px-5">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.accessToken}
              className="border-b border-deep/8 last:border-0 hover:bg-cream/30"
            >
              <td className="px-4 py-3.5 align-middle font-medium text-deep sm:px-5">
                {booking.service.name}
              </td>
              <td className="px-4 py-3.5 align-middle whitespace-nowrap text-deep/65 sm:px-5">
                {formatLagos(booking.startsAt, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3.5 align-middle sm:px-5">
                <AccountStatusBadge status={booking.status} />
              </td>
              <td className="px-4 py-3.5 align-middle text-right sm:px-5">
                <Link
                  href={`/appointments/${booking.accessToken}`}
                  className="inline-flex min-h-9 items-center text-xs font-medium text-deep underline-offset-2 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** @deprecated Prefer AccountBookingsTable */
export function AccountBookingCard({ booking }: { booking: AccountBooking }) {
  return <AccountBookingsTable bookings={[booking]} />;
}
