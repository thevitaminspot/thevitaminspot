"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Drop Paystack query params after return handling so refresh does not re-verify forever. */
export function PaystackReturnCleanup({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!active) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("reference") && !params.has("trxref")) return;
    params.delete("reference");
    params.delete("trxref");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [active, pathname, router]);

  return null;
}
