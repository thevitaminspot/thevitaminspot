"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { formatNaira } from "@/lib/money";
import { formSubmit, formSubmitInline } from "@/components/ui/form-styles";
import { useCartStore } from "@/stores/cart-store";

export function CartDrawer() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Your bag"
    >
      <button
        type="button"
        className="animate-backdrop-in absolute inset-0 bg-ink/50 backdrop-blur-[3px]"
        aria-label="Close cart"
        onClick={close}
      />

      <aside className="animate-drawer-in relative z-10 flex h-full w-full max-w-md flex-col border-l border-deep/10 bg-gradient-to-b from-white via-cream to-cream shadow-[-12px_0_40px_rgba(8,21,15,0.12)]">
        <div className="relative flex items-center justify-between border-b border-deep/8 px-5 py-4">
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
            className="nav-icon grid size-11 place-items-center rounded-full text-deep/70 hover:text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
          >
            <X className="size-5" strokeWidth={1.35} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-2xl text-deep">Your bag is empty</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-deep/65">
                Nothing here yet. Have a look at the packs.
              </p>
              <Link href="/shop" onClick={close} className={`mt-6 ${formSubmitInline}`}>
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
                        className="truncate text-sm font-medium text-deep hover:text-deep-hover"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-deep/65 transition hover:bg-red-50 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="mt-1 text-xs font-semibold text-deep">
                      {formatNaira(item.price)}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex h-10 items-stretch overflow-hidden rounded-xl border border-deep/15 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="inline-flex w-10 shrink-0 items-center justify-center text-sm leading-none text-deep/75 transition hover:bg-tint"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="inline-flex w-9 shrink-0 items-center justify-center text-xs font-semibold leading-none text-deep">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          className="inline-flex w-10 shrink-0 items-center justify-center text-sm leading-none text-deep/75 transition hover:bg-tint"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs text-deep/70">
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
        <div className="border-t border-deep/8 bg-white/70 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {items.length > 0 ? (
            <>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-deep/70">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-deep">{formatNaira(total)}</span>
                </div>
                <div className="flex justify-between text-deep/70">
                  <span>Delivery</span>
                  <span className="text-[11px] font-medium text-deep/75">Calculated at checkout</span>
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

              <p className="mt-3 text-center text-[11px] text-deep/65">
                Abuja, other Nigerian cities, or international — fees at checkout.
              </p>
            </>
          ) : (
            <div>
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-deep/10 bg-deep/5 py-3.5 text-xs font-medium tracking-[0.15em] text-deep/50 uppercase cursor-not-allowed"
                title="Your bag is empty. Please select an item to checkout."
              >
                <span>Add something first</span>
              </button>
              <p className="mt-3 text-center text-[11px] text-deep/65">
                Add a pack before you check out.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
