"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { formatNaira } from "@/lib/money";
import { useCartStore } from "@/stores/cart-store";

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove } = useCartStore();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close cart"
        onClick={close}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-3xl">Your bag</h2>
          <button type="button" onClick={close} aria-label="Close cart">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="text-deep/60">Your bag is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={84}
                  height={84}
                  className="size-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm">{item.name}</p>
                  <p className="mt-1 text-sm text-sage">{formatNaira(item.price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="size-7 rounded-lg border border-deep/15"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="size-7 rounded-lg border border-deep/15"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      className="ml-auto text-xs tracking-widest uppercase"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-champagne/50 px-6 py-5">
          <div className="mb-4 flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatNaira(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={close}
            className="flex w-full items-center justify-center rounded-lg bg-deep py-3 text-[11px] tracking-[0.1em] text-cream uppercase"
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
