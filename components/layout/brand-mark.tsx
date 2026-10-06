import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import { brand } from "@/lib/brand";

/** Pin mark only — crops the wordmark from the full logo file. */
export function BrandMark({
  size = 40,
  className = "",
  ...props
}: {
  size?: number;
  className?: string;
} & ComponentPropsWithoutRef<"span">) {
  return (
    <span
      {...props}
      className={`relative inline-block shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={brand.logo.width}
        height={brand.logo.height}
        className="absolute left-1/2 max-w-none -translate-x-1/2 object-cover object-top"
        style={{
          width: size * 1.35,
          height: size * 1.75,
          top: 0,
        }}
        priority
      />
    </span>
  );
}
