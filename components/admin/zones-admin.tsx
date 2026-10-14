"use client";

import { useState } from "react";
import { DeliveryZoneList } from "@/components/admin/delivery-zone-list";
import { AddZonePanel } from "@/components/admin/zone-form";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
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
  const [adding, setAdding] = useState(false);

  function notify(message: string) {
    if (/could not|failed|error/i.test(message)) {
      adminNotifyError(message);
    } else {
      adminNotifySuccess(message);
    }
  }
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

      <div className="space-y-6">
        {adding ? (
          <div ref={addFormRef}>
            <AddZonePanel
              onCancel={() => setAdding(false)}
              onSuccess={(name) => {
                setAdding(false);
                adminNotifySuccess(`${name} added.`);
              }}
              onError={adminNotifyError}
            />
          </div>
        ) : null}

        <AdminPanel clip={false}>
          <DeliveryZoneList zones={zones} onMessage={notify} />
        </AdminPanel>
      </div>
    </div>
  );
}
