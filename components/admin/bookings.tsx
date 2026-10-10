"use client";

import { useMemo, useState } from "react";
import { updateAppointmentStatus } from "@/actions/admin";
import { AppointmentCancelConfirm } from "@/components/admin/appointment-cancel-confirm";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import {
  AdminEmptyState,
  AdminFilterTabs,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/ui";
import { PaginatedTableWrap } from "@/components/admin/paginated-table-wrap";
import { adminButtonPrimary, adminButtonSecondary, interactiveControl } from "@/components/ui/form-styles";
import { bookingQueue, isOverdueBooking, type BookingQueue } from "@/lib/admin-bookings";
import { formatLagos } from "@/lib/datetime";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatNaira } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type BookingRow = {
  id: string;
  startsAt: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  serviceName: string;
  deposit: number;
  sessionPrice: number;
  depositPaid: number | null;
};

function when(iso: string) {
  return formatLagos(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function bookingSearchText(row: BookingRow) {
  return `${row.name} ${row.email} ${row.phone ?? ""} ${row.serviceName} ${row.status}`;
}

function BookingActions({ row }: { row: BookingRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState("");
  const overdue = isOverdueBooking(row.status, row.startsAt);

  function setStatus(status: "CONFIRMED" | "COMPLETED") {
    setError("");
    start(async () => {
      const result = await updateAppointmentStatus(row.id, status);
      if ("error" in result && result.error) setError(result.error);
      else router.refresh();
    });
  }

  if (row.status === "CANCELLED" || row.status === "COMPLETED") {
    return <AdminStatusBadge status={row.status} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {row.status === "PENDING" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("CONFIRMED")}
          className={adminButtonPrimary}
        >
          {pending ? "Saving…" : "Confirm booking"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("COMPLETED")}
          className={overdue ? adminButtonPrimary : adminButtonSecondary}
        >
          {pending ? "Saving…" : overdue ? "Mark done (overdue)" : "Mark session done"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => setCancelOpen(true)}
        className={`text-xs text-deep/45 underline-offset-2 hover:text-red-700 hover:underline ${interactiveControl}`}
      >
        Cancel
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
      <AppointmentCancelConfirm
        open={cancelOpen}
        id={row.id}
        guestName={row.name}
        serviceName={row.serviceName}
        when={when(row.startsAt)}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}

export function AdminBookings({ rows }: { rows: BookingRow[] }) {
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<BookingQueue>(() => {
    if (rows.some((row) => row.status === "PENDING")) return "requests";
    if (rows.some((row) => bookingQueue(row.status) === "upcoming")) return "upcoming";
    return "all";
  });

  const counts = useMemo(() => {
    const next = { requests: 0, upcoming: 0, completed: 0, cancelled: 0, all: rows.length };
    for (const row of rows) next[bookingQueue(row.status)] += 1;
    return next;
  }, [rows]);

  const visible = useMemo(() => {
    const inQueue =
      queue === "all" ? rows : rows.filter((row) => bookingQueue(row.status) === queue);
    const filtered = filterByQuery(inQueue, query, bookingSearchText);
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return queue === "upcoming" || queue === "requests" ? diff : -diff;
    });
  }, [rows, queue, query]);

  const pagination = usePaginatedList(visible, `${queue}:${query}`);

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search guest, email, or session"
        countLabel={`${pagination.total} matching · ${rows.length} total`}
        className="mb-4"
      />
      <AdminFilterTabs
        value={queue}
        onChange={(id) => setQueue(id as BookingQueue)}
        tabs={[
          { id: "requests", label: "Requests", count: counts.requests },
          { id: "upcoming", label: "Upcoming", count: counts.upcoming },
          { id: "completed", label: "Completed", count: counts.completed },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
          { id: "all", label: "All", count: counts.all },
        ]}
      />

      {visible.length === 0 ? (
        <AdminEmptyState>
          {rows.length === 0 ? "Bookings will show up here." : "No bookings in this view."}
        </AdminEmptyState>
      ) : (
        <PaginatedTableWrap pagination={pagination.tablePaginationProps("bookings")}>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>When</AdminTableHeaderCell>
                <AdminTableHeaderCell>Guest</AdminTableHeaderCell>
                <AdminTableHeaderCell>Session</AdminTableHeaderCell>
                <AdminTableHeaderCell>Deposit</AdminTableHeaderCell>
                <AdminTableHeaderCell>Action</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {pagination.visible.map((row) => {
                const overdue = isOverdueBooking(row.status, row.startsAt);
                return (
                  <AdminTableRow key={row.id}>
                    <AdminTableCell className="whitespace-nowrap">
                      <span className="text-deep/80">{when(row.startsAt)}</span>
                      {overdue ? (
                        <span className="mt-1 block text-[11px] text-amber-800">Overdue</span>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="font-medium text-deep">{row.name}</span>
                      <span className="mt-1 block text-deep/50">
                        {row.email}
                        {row.phone ? ` · ${row.phone}` : ""}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-deep">{row.serviceName}</span>
                      <span className="mt-1 block text-[11px] text-deep/45">
                        {formatNaira(row.sessionPrice)}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      {row.deposit <= 0 ? (
                        <span className="text-deep/35">None</span>
                      ) : row.depositPaid != null ? (
                        <AdminStatusBadge status="PAID" label="Paid" />
                      ) : (
                        <AdminStatusBadge status="PENDING" label="Due" />
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <BookingActions row={row} />
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
          </AdminTable>
        </PaginatedTableWrap>
      )}
    </div>
  );
}
