"use client";

import dynamic from "next/dynamic";

const CartDrawer = dynamic(
  () => import("@/components/shop/cart-drawer").then((module) => module.CartDrawer),
  { ssr: false },
);

export function CartDrawerLoader() {
  return <CartDrawer />;
}
