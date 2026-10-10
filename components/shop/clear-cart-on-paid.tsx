"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

export function ClearCartOnPaid() {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
