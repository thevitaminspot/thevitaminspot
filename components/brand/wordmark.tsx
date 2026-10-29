import { site } from "@/lib/site";

export function BrandWordmark({ className = "" }: { className?: string }) {
  return <span className={`font-wordmark ${className}`}>{site.name}</span>;
}
