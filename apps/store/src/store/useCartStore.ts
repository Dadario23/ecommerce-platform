import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartLineKey } from "@/lib/cart-line";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
};

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      addToCart: (item) =>
        set((state) => {
          const key = cartLineKey(item);
          const existing = state.items.find((p) => cartLineKey(p) === key);
          if (existing) {
            return {
              items: state.items.map((p) =>
                cartLineKey(p) === key
                  ? { ...p, quantity: p.quantity + item.quantity }
                  : p
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeFromCart: (lineKey) =>
        set((state) => ({
          items: state.items.filter((p) => cartLineKey(p) !== lineKey),
        })),
      updateQuantity: (lineKey, quantity) =>
        set((state) => ({
          items: state.items.map((p) =>
            cartLineKey(p) === lineKey ? { ...p, quantity } : p
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "cart-storage" } // 🔹 Se guarda en localStorage
  )
);
