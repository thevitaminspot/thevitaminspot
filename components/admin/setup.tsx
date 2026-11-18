"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedCatalogue } from "@/actions/admin";
import { adminButtonPrimary } from "@/components/ui/form-styles";
import { adminNotifyError, adminNotifySuccess } from "@/lib/admin-toast";
import { withActionError } from "@/lib/server-action-error";

export function DatabaseSetup() {
  return (
    <div className="panel bg-white px-5 py-6 text-sm leading-7 text-deep/75">
      <p className="font-medium text-deep">Neon is not connected.</p>
      <p className="mt-2">
        Set <code>DATABASE_URL</code> to your Neon connection string, run{" "}
        <code>npx prisma db push</code>, then reload. Products, orders, bookings, and delivery
        zones are saved there.
      </p>
    </div>
  );
}

export function SeedCatalogueButton({ label = "Load starter catalogue" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const result = await withActionError(
              () => seedCatalogue(),
              adminNotifyError,
              "Could not load catalogue.",
            );
            if (!result) return;
            if ("error" in result && result.error) {
              adminNotifyError(result.error);
              return;
            }
            adminNotifySuccess("Catalogue loaded.");
            router.refresh();
          });
        }}
        className={adminButtonPrimary}
      >
        {pending ? "Loading" : label}
      </button>
    </div>
  );
}
