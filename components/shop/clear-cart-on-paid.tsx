"use client";

import { useEffect } from "react";
import { clearSavedCheckout } from "@/lib/checkout-session";
import { useCartStore } from "@/stores/cart-store";

export function ClearCartOnPaid() {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
    clearSavedCheckout();
  }, [clear]);

  return null;
}
