"use client";

import { Search } from "lucide-react";
import { adminFormSearch } from "@/components/ui/form-styles";

export function filterByQuery<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
}

export function AdminListSearch({
  value,
  onChange,
  placeholder,
  countLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  countLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {countLabel ? (
        <p className="text-[11px] tracking-[0.14em] text-deep/45 uppercase">{countLabel}</p>
      ) : (
        <span className="hidden sm:block sm:flex-1" aria-hidden />
      )}
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-deep/40" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={adminFormSearch}
        />
      </div>
    </div>
  );
}
