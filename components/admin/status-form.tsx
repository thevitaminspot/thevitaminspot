"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateAppointmentStatus, updateOrderStatus } from "@/actions/admin";
import { adminFormSelect } from "@/components/ui/form-styles";

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
      <select name="status" defaultValue={status} className={adminFormSelect}>
        {["PENDING", "PAID", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className="ml-2 text-[10px] tracking-widest uppercase">Save</button>
    </form>
  );
}

const appointmentStatusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const appointmentStatusStyle: Record<string, string> = {
  PENDING: "border-amber-200/80 bg-amber-50 text-amber-950",
  CONFIRMED: "border-sage/50 bg-sage/15 text-deep",
  CANCELLED: "border-deep/15 bg-deep/[0.04] text-deep/65",
  COMPLETED: "border-deep/20 bg-cream text-deep",
};

export function AppointmentStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="relative inline-flex">
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        aria-label="Booking status"
        className={`min-w-[9.25rem] appearance-none rounded-lg border py-2 pl-3 pr-9 text-sm font-medium transition focus:border-deep/40 focus:outline-none disabled:cursor-wait disabled:opacity-60 ${appointmentStatusStyle[status] ?? "border-deep/15 bg-white text-deep"}`}
        onChange={(event) => {
          const value = event.target.value;
          start(async () => {
            await updateAppointmentStatus(id, value as never);
            router.refresh();
          });
        }}
      >
        {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((item) => (
          <option key={item} value={item}>
            {appointmentStatusLabel[item] ?? item}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-deep/45"
        aria-hidden
      />
    </div>
  );
}
