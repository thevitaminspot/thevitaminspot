"use client";

import dynamic from "next/dynamic";
import { useCartStore } from "@/stores/cart-store";

const CartDrawer = dynamic(
  () => import("@/components/shop/cart-drawer").then((module) => module.CartDrawer),
  { ssr: false },
);

export function CartDrawerLoader() {
  const isOpen = useCartStore((state) => state.isOpen);
  if (!isOpen) return null;
  return <CartDrawer />;
}
