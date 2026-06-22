import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      addToCart: (item) =>
        set((state) => {
          const existing = state.items.find((p) => p.id === item.id);
          if (existing) {
            return {
              items: state.items.map((p) =>
                p.id === item.id
                  ? { ...p, quantity: p.quantity + item.quantity }
                  : p
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeFromCart: (id) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((p) => (p.id === id ? { ...p, quantity } : p)),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "cart-storage" } // 🔹 Se guarda en localStorage
  )
);
