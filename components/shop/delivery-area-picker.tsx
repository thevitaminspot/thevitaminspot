"use client";

import { useMemo, useState } from "react";
import type { CatalogZone } from "@/lib/catalog";
import { formatNaira } from "@/lib/money";
import { formLabel, interactiveControl } from "@/components/ui/form-styles";
import { SearchField } from "@/components/ui/search-field";

export function DeliveryAreaPicker({
  zones,
  value,
  onChange,
}: {
  zones: CatalogZone[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = zones.find((zone) => zone.slug === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...zones].sort((a, b) => a.name.localeCompare(b.name));
    if (!needle) return sorted;
    return sorted.filter((zone) => zone.name.toLowerCase().includes(needle));
  }, [zones, query]);

  return (
    <div>
      <label className={formLabel} htmlFor="abuja-area-search">
        Abuja area *
      </label>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search area — e.g. Jabi, Gwarinpa"
        variant="checkout"
        className="mt-1.5"
        id="abuja-area-search"
      />
      <div
        className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-deep/12 bg-white/60 p-2"
        role="listbox"
        aria-label="Abuja areas"
      >
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-sm text-deep/50">No areas match “{query}”.</p>
        ) : (
          filtered.map((zone) => {
            const active = zone.slug === value;
            return (
              <button
                key={zone.slug}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onChange(zone.slug)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${interactiveControl} ${
                  active ? "bg-deep text-cream" : "text-deep hover:bg-tint/50"
                }`}
              >
                <span className="font-medium">{zone.name}</span>
                <span className={active ? "text-cream/70" : "text-deep/50"}>
                  {formatNaira(zone.fee)}
                </span>
              </button>
            );
          })
        )}
      </div>
      {selected ? (
        <p className="mt-2 text-[11px] font-medium text-sage">
          Selected: {selected.name} · {formatNaira(selected.fee)}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-deep/60">Choose an Abuja area.</p>
      )}
    </div>
  );
}
