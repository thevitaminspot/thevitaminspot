"use client";

import { updateAppointmentStatus, updateOrderStatus } from "@/actions/admin";

export function OrderStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("status"));
        await updateOrderStatus(id, value as never);
      }}
    >
      <select name="status" defaultValue={status} className="rounded-lg border border-deep/15 bg-white px-3 py-2">
        {["PENDING", "PAID", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className="ml-2 text-[10px] tracking-widest uppercase">Save</button>
    </form>
  );
}

export function AppointmentStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("status"));
        await updateAppointmentStatus(id, value as never);
      }}
    >
      <select name="status" defaultValue={status} className="rounded-lg border border-deep/15 bg-white px-3 py-2">
        {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className="ml-2 text-[10px] tracking-widest uppercase">Save</button>
    </form>
  );
}
