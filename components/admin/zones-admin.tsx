"use client";

import { useState } from "react";
import { DeliveryZoneList } from "@/components/admin/delivery-zone-list";
import { AddZonePanel } from "@/components/admin/zone-form";
import { AdminFeedback, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { useScrollIntoView } from "@/components/admin/use-scroll-into-view";

type Zone = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  eta: string;
  isActive: boolean;
};

export function ZonesAdmin({
  zones,
  activeCount,
}: {
  zones: Zone[];
  activeCount: number;
}) {
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const addFormRef = useScrollIntoView<HTMLDivElement>(adding ? "add" : null);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Delivery"
        description={`${activeCount} active of ${zones.length} zones. Abuja courier rates and delivery timelines.`}
        action={
          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            className="cursor-pointer rounded-lg bg-deep px-4 py-2.5 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-sage"
          >
            {adding ? "Close form" : "+ Add delivery zone"}
          </button>
        }
      />

      {adding ? (
        <div ref={addFormRef} className="mb-4">
          <AddZonePanel
            onCancel={() => setAdding(false)}
            onSuccess={(name) => {
              setAdding(false);
              setMessage(`${name} added.`);
            }}
            onError={setMessage}
          />
        </div>
      ) : null}

      {message ? (
        <div className="mb-4">
          <AdminFeedback message={message} onDismiss={() => setMessage("")} />
        </div>
      ) : null}

      <AdminPanel clip={false}>
        <DeliveryZoneList zones={zones} onMessage={setMessage} />
      </AdminPanel>
    </div>
  );
}
