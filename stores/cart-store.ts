import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (line) => line.productId === item.productId,
          );
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((line) =>
                line.productId === item.productId
                  ? { ...line, quantity: line.quantity + quantity }
                  : line,
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, { ...item, quantity }],
          };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((line) => line.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((line) => line.productId !== productId)
              : state.items.map((line) =>
                  line.productId === productId ? { ...line, quantity } : line,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "tvs-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
