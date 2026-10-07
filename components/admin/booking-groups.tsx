"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminListSearch, filterByQuery } from "@/components/admin/list-search";
import { AppointmentStatusForm } from "@/components/admin/status-form";
import {
  AdminEmptyState,
  AdminPanel,
  AdminSection,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { AdminShowMoreFooter, useCollapsibleList } from "@/components/admin/show-more";

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
  return new Date(iso).toLocaleString("en-NG", {
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

function BookingTable({
  rows,
  footer,
}: {
  rows: BookingRow[];
  footer?: ReactNode;
}) {
  if (rows.length === 0) {
    return <AdminEmptyState>Nothing here yet.</AdminEmptyState>;
  }

  return (
    <AdminTableWrap footer={footer}>
      <AdminTable>
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>When</AdminTableHeaderCell>
            <AdminTableHeaderCell>Guest</AdminTableHeaderCell>
            <AdminTableHeaderCell>Session</AdminTableHeaderCell>
            <AdminTableHeaderCell>Deposit</AdminTableHeaderCell>
            <AdminTableHeaderCell className="w-44">Status</AdminTableHeaderCell>
          </tr>
        </AdminTableHead>
        <tbody>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="whitespace-nowrap text-deep/80">
                {when(row.startsAt)}
              </AdminTableCell>
              <AdminTableCell>
                <span className="font-medium text-deep">{row.name}</span>
                <span className="mt-1 block text-deep/50">
                  {row.email}
                  {row.phone ? ` · ${row.phone}` : ""}
                </span>
              </AdminTableCell>
              <AdminTableCell>{row.serviceName}</AdminTableCell>
              <AdminTableCell>
                {row.depositPaid != null ? (
                  <span className="text-[11px] tracking-[0.12em] text-sage uppercase">Paid</span>
                ) : row.deposit > 0 ? (
                  <span className="text-deep/45">Due</span>
                ) : (
                  <span className="text-deep/35">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell>
                {row.status === "CANCELLED" || row.status === "COMPLETED" ? (
                  <AdminStatusBadge status={row.status} />
                ) : (
                  <AppointmentStatusForm
                    id={row.id}
                    status={row.status}
                    guestName={row.name}
                    serviceName={row.serviceName}
                    when={new Date(row.startsAt).toLocaleString("en-NG")}
                  />
                )}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTable>
    </AdminTableWrap>
  );
}

function BookingSection({
  title,
  rows,
  uncapped = false,
  label,
  resetKey,
}: {
  title: string;
  rows: BookingRow[];
  uncapped?: boolean;
  label?: string;
  resetKey?: string;
}) {
  const list = useCollapsibleList(rows, { uncapped, resetKey });

  if (rows.length === 0) return null;

  const footer = list.collapsible ? (
    <AdminShowMoreFooter
      expanded={list.expanded}
      total={list.total}
      hiddenCount={list.hiddenCount}
      label={label}
      onToggle={() => list.setExpanded((value) => !value)}
    />
  ) : null;

  return (
    <AdminSection title={`${title} · ${rows.length}`}>
      <BookingTable rows={list.visible} footer={footer} />
    </AdminSection>
  );
}

export function AdminBookingGroups({
  needsAttention,
  upcoming,
  archive,
}: {
  needsAttention: BookingRow[];
  upcoming: BookingRow[];
  archive: BookingRow[];
}) {
  const [query, setQuery] = useState("");
  const total = needsAttention.length + upcoming.length + archive.length;

  const filteredAttention = useMemo(
    () => filterByQuery(needsAttention, query, bookingSearchText),
    [needsAttention, query],
  );
  const filteredUpcoming = useMemo(
    () => filterByQuery(upcoming, query, bookingSearchText),
    [upcoming, query],
  );
  const filteredArchive = useMemo(
    () => filterByQuery(archive, query, bookingSearchText),
    [archive, query],
  );
  const filteredTotal = filteredAttention.length + filteredUpcoming.length + filteredArchive.length;

  return (
    <div>
      <AdminListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by guest, email, session, or status…"
        countLabel={`${filteredTotal} of ${total} bookings`}
        className="mb-8"
      />

      {filteredTotal === 0 ? (
        <AdminEmptyState>
          {query.trim() ? "No bookings match your search." : "No bookings yet."}
        </AdminEmptyState>
      ) : (
        <div className="space-y-10">
          <BookingSection
            title="Needs attention"
            rows={filteredAttention}
            uncapped
            resetKey={query}
          />

          <BookingSection
            title="Upcoming"
            rows={filteredUpcoming}
            label="upcoming"
            resetKey={query}
          />

          {filteredAttention.length === 0 && filteredUpcoming.length === 0 ? (
            <AdminPanel>
              <AdminEmptyState>
                No upcoming bookings. New requests will appear under “Needs attention”.
              </AdminEmptyState>
            </AdminPanel>
          ) : null}

          <BookingSection
            title="Archive"
            rows={filteredArchive}
            label="in archive"
            resetKey={query}
          />
        </div>
      )}
    </div>
  );
}
