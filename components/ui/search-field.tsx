"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import { interactiveControl } from "@/components/ui/form-styles";

const variants = {
  storefront:
    "rounded-2xl border border-deep/12 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus-within:border-deep/28 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(11,44,33,0.07)]",
  admin:
    "rounded-xl border border-deep/10 bg-white focus-within:border-deep/25 focus-within:shadow-[0_0_0_3px_rgba(11,44,33,0.05)]",
  checkout:
    "rounded-xl border border-deep/15 bg-cream/30 focus-within:border-deep/35 focus-within:bg-white",
} as const;

export function SearchField({
  value,
  onChange,
  placeholder,
  id,
  label,
  variant = "admin",
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  label?: string;
  variant?: keyof typeof variants;
  className?: string;
  inputClassName?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 block text-[11px] tracking-[0.16em] text-deep/45 uppercase"
        >
          {label}
        </label>
      ) : null}
      <div className={`group relative flex items-center transition ${variants[variant]}`}>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-deep/35 transition group-focus-within:text-deep/55"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className={`w-full appearance-none bg-transparent py-2.5 pr-10 pl-10 text-sm text-deep placeholder:text-deep/35 outline-none [&::-webkit-search-cancel-button]:appearance-none ${inputClassName}`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className={`absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-deep/40 transition hover:bg-deep/5 hover:text-deep ${interactiveControl}`}
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
