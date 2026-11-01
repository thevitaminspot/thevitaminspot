"use client";

import { SearchField } from "@/components/ui/search-field";

export function filterByQuery<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
}

/** Shared list toolbar: count on the left, search on the right — always above the table panel. */
export function AdminListSearch({
  value,
  onChange,
  placeholder,
  countLabel,
  className = "mb-4",
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
      <SearchField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant="admin"
        className="w-full sm:max-w-xs"
      />
    </div>
  );
}
