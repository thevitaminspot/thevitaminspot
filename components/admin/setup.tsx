"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedCatalogue } from "@/actions/admin";

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
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const result = await seedCatalogue();
            setMessage("error" in result && result.error ? result.error : "Catalogue loaded.");
            if ("ok" in result) router.refresh();
          });
        }}
        className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.12em] text-cream uppercase"
      >
        {pending ? "Loading" : label}
      </button>
      {message ? <p className="mt-3 text-sm text-deep/70">{message}</p> : null}
    </div>
  );
}
