"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInfusion } from "@/actions/admin";
import { AddInfusionForm, InfusionEditor } from "@/components/admin/editors";
import { nairaLabel } from "@/lib/money";
import type { CatalogInfusion } from "@/lib/catalog";

export function InfusionCatalog({
  infusions,
  library,
}: {
  infusions: CatalogInfusion[];
  library: string[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const editing = infusions.find((item) => item.id === editingId);

  function remove(item: CatalogInfusion) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    start(async () => {
      const result = await deleteInfusion(item.id);
      setMessage("error" in result && result.error ? result.error : `${item.name} deleted.`);
      if ("ok" in result) {
        if (editingId === item.id) setEditingId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-deep/60">
          {infusions.length} {infusions.length === 1 ? "session" : "sessions"}
        </p>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="rounded-lg bg-deep px-4 py-2 text-[11px] tracking-[0.12em] text-cream uppercase"
        >
          {adding ? "Close" : "Add session"}
        </button>
      </div>

      {adding ? (
        <div className="mt-4">
          <AddInfusionForm library={library} />
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-deep/70">{message}</p> : null}

      <ul className="mt-4 divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white">
        {infusions.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-deep">{item.name}</p>
              <p className="mt-1 text-sm text-deep/55">
                {nairaLabel(item.price)} · deposit {nairaLabel(item.deposit)} · {item.durationMin} min
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-deep/15 px-3 py-2 text-sm"
              onClick={() => setEditingId(editingId === item.id ? null : item.id)}
            >
              {editingId === item.id ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg border border-deep/15 px-3 py-2 text-sm disabled:opacity-40"
              onClick={() => remove(item)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {editing ? (
        <div className="mt-6">
          <p className="mb-3 text-sm text-deep/60">Editing {editing.name}</p>
          <InfusionEditor key={editing.id} infusion={editing} library={library} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-deep/55">Add a session, or open one to change what the booking page shows.</p>
      )}
    </div>
  );
}
