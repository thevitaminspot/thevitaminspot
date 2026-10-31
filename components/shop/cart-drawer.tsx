"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/money";
import { formSubmit } from "@/components/ui/form-styles";
import { useCartStore } from "@/stores/cart-store";

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, close, setQuantity, remove } = useCartStore();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="animate-backdrop-in absolute inset-0 bg-ink/50 backdrop-blur-[3px]"
        aria-label="Close cart"
        onClick={close}
      />

      <aside className="animate-drawer-in relative z-10 flex h-full w-full max-w-md flex-col border-l border-deep/10 bg-gradient-to-b from-white via-cream to-cream shadow-[-12px_0_40px_rgba(8,21,15,0.12)]">
        <div className="relative flex items-center justify-between border-b border-deep/8 px-5 py-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            aria-hidden
          />
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-2xl text-deep">Your bag</h2>
            <span className="rounded-full bg-deep/8 px-2.5 py-0.5 text-xs font-semibold text-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              {itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="nav-icon rounded-full px-3 py-2 text-xs tracking-[0.12em] text-deep/60 uppercase hover:text-deep"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-2xl text-deep">Your bag is empty</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-deep/60">
                Nothing here yet. Have a look at the packs.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className={`mt-6 ${formSubmit} w-auto px-5`}
              >
                See the packs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-deep/10">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 pb-6 pt-4 first:pt-0">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-deep/10 bg-white">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full bg-tint/60" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/shop/${item.slug}`}
                        onClick={close}
                        className="truncate text-sm font-medium text-deep hover:text-sage"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 p-1 text-deep/40 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="mt-1 text-xs font-semibold text-deep">
                      {formatNaira(item.price)}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-deep/15 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-deep/70 transition hover:bg-tint"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-deep">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-deep/70 transition hover:bg-tint"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs text-deep/60">
                        Total: {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-deep/8 bg-white/70 p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {items.length > 0 ? (
            <>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-deep/60">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-deep">{formatNaira(total)}</span>
                </div>
                <div className="flex justify-between text-deep/60">
                  <span>Abuja Delivery</span>
                  <span className="text-[11px] text-sage font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-deep/10 pt-3">
                <span className="text-sm font-semibold text-deep">Estimated Subtotal</span>
                <span className="font-display text-2xl text-deep">{formatNaira(total)}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  close();
                  router.push("/checkout");
                }}
                className={`mt-5 ${formSubmit}`}
              >
                Checkout
              </button>

              <p className="mt-3 text-center text-[10px] text-deep/50">
                Same-day delivery in Abuja, if you order early.
              </p>
            </>
          ) : (
            <div>
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-deep/10 bg-deep/5 py-3.5 text-xs font-medium tracking-[0.15em] text-deep/35 uppercase cursor-not-allowed"
                title="Your bag is empty. Please select an item to checkout."
              >
                <span>Add something first</span>
              </button>
              <p className="mt-3 text-center text-[11px] text-deep/50">
                Add a pack before you check out.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
