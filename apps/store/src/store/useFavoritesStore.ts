import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  ids: string[];
  hydrate: (ids: string[]) => void;
  toggle: (productId: string) => void;
  isFavorited: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],

      hydrate: (ids) => set({ ids }),

      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),

      isFavorited: (productId) => get().ids.includes(productId),

      clear: () => set({ ids: [] }),
    }),
    { name: "favorites-storage" }
  )
);
