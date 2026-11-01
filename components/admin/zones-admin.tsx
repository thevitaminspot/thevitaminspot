"use client";

import { useState } from "react";
import { DeliveryZoneList } from "@/components/admin/delivery-zone-list";
import { AddZoneForm } from "@/components/admin/zone-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";

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

  return (
    <div>
      <AdminPageHeader
        eyebrow="Shop"
        title="Delivery"
        description={`${activeCount} active of ${zones.length} zones. Abuja areas, other Nigerian cities, and international.`}
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="cursor-pointer rounded-lg bg-deep px-4 py-2.5 text-[11px] tracking-[0.14em] text-cream uppercase transition hover:bg-sage"
          >
            + Add delivery zone
          </button>
        }
      />

      <DeliveryZoneList
        zones={zones}
        onMessage={(message) => {
          if (/could not|failed|error/i.test(message)) adminNotifyError(message);
          else adminNotifySuccess(message);
        }}
      />

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New delivery zone"
        description="Name the area or destination, courier fee, and estimated delivery time."
        size="lg"
      >
        <AddZoneForm
          onSuccess={(name) => {
            setAdding(false);
            adminNotifySuccess(`${name} added.`);
          }}
          onError={adminNotifyError}
        />
      </Modal>
    </div>
  );
}
