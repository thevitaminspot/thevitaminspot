"use client";

import { useMemo, useState } from "react";
import type { CatalogZone } from "@/lib/catalog";
import {
  type DeliveryRegion,
  isAbujaAreaZone,
  partitionZones,
} from "@/lib/delivery-regions";
import { formatNaira } from "@/lib/money";
import { formLabel, interactiveControl } from "@/components/ui/form-styles";
import { Search, X } from "lucide-react";

const regionOptions: {
  id: DeliveryRegion;
  label: string;
}[] = [
  { id: "abuja", label: "Abuja" },
  { id: "nigeria", label: "Nigeria" },
  { id: "international", label: "International" },
];

export function DeliveryAreaPicker({
  zones,
  region,
  onRegionChange,
  value,
  onChange,
}: {
  zones: CatalogZone[];
  region: DeliveryRegion;
  onRegionChange: (region: DeliveryRegion) => void;
  value: string;
  onChange: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => partitionZones(zones), [zones]);
  const abujaZones = grouped.abuja;
  const nigeriaZone = grouped.nigeria[0];
  const internationalZone = grouped.international[0];

  const selected = zones.find((zone) => zone.slug === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return abujaZones;
    return abujaZones.filter((zone) => zone.name.toLowerCase().includes(needle));
  }, [abujaZones, query]);

  const feeLabel = (id: DeliveryRegion) => {
    if (id === "abuja") {
      if (abujaZones.length === 0) return "";
      return `from ${formatNaira(Math.min(...abujaZones.map((zone) => zone.fee)))}`;
    }
    if (id === "nigeria") return nigeriaZone ? formatNaira(nigeriaZone.fee) : "";
    return internationalZone ? formatNaira(internationalZone.fee) : "";
  };

  return (
    <div className="space-y-5">
      <div>
        <p className={formLabel}>Where should we send it?</p>
        <div
          className="mt-2 flex rounded-xl border border-deep/12 bg-cream/40 p-1"
          role="radiogroup"
          aria-label="Delivery destination"
        >
          {regionOptions.map((option) => {
            const active = region === option.id;
            const available =
              option.id === "abuja"
                ? abujaZones.length > 0
                : option.id === "nigeria"
                  ? Boolean(nigeriaZone)
                  : Boolean(internationalZone);
            const fee = feeLabel(option.id);

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!available}
                onClick={() => onRegionChange(option.id)}
                className={`min-w-0 flex-1 rounded-lg px-2.5 py-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${interactiveControl} ${
                  active
                    ? "bg-white text-deep shadow-[0_1px_2px_rgba(11,44,33,0.08)] ring-1 ring-deep/10"
                    : "text-deep/55 hover:text-deep"
                }`}
              >
                <span className="block text-[11px] font-medium tracking-[0.08em] uppercase">
                  {option.label}
                </span>
                {fee ? (
                  <span
                    className={`mt-0.5 block text-[10px] tabular-nums ${
                      active ? "text-deep/50" : "text-deep/35"
                    }`}
                  >
                    {fee}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {region === "abuja" ? (
        <div>
          <div className="flex items-end justify-between gap-3">
            <label className={formLabel} htmlFor="abuja-area-search">
              Abuja area *
            </label>
            {selected && isAbujaAreaZone(selected.slug) ? (
              <p className="pb-0.5 text-[11px] tabular-nums text-deep/45">
                {formatNaira(selected.fee)}
              </p>
            ) : null}
          </div>

          <div className="mt-1.5 overflow-hidden rounded-xl border border-deep/12 bg-white">
            <div className="relative border-b border-deep/8">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-deep/35"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id="abuja-area-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Jabi, Gwarinpa…"
                autoComplete="off"
                spellCheck={false}
                className="w-full appearance-none bg-transparent py-3 pr-10 pl-10 text-sm text-deep placeholder:text-deep/35 outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className={`absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-deep/40 transition hover:bg-deep/5 hover:text-deep ${interactiveControl}`}
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>

            <div
              className="max-h-48 overflow-y-auto overscroll-contain py-1"
              role="listbox"
              aria-label="Abuja areas"
            >
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-deep/45">
                  No areas match “{query}”.
                </p>
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
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${interactiveControl} ${
                        active
                          ? "bg-tint/55 text-deep"
                          : "text-deep/80 hover:bg-cream/70"
                      }`}
                    >
                      <span className={`truncate ${active ? "font-medium" : ""}`}>
                        {zone.name}
                      </span>
                      <span
                        className={`shrink-0 tabular-nums ${
                          active ? "text-deep/60" : "text-deep/40"
                        }`}
                      >
                        {formatNaira(zone.fee)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-deep/60">
          Flat fee{" "}
          <span className="font-medium text-deep">
            {formatNaira(
              region === "nigeria" ? (nigeriaZone?.fee ?? 0) : (internationalZone?.fee ?? 0),
            )}
          </span>
          . Add the destination city
          {region === "international" ? " and country" : ""} below.
        </p>
      )}
    </div>
  );
}
