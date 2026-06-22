"use client";
import { create } from "zustand";

interface CartUIState {
  isDrawerOpen: boolean;
  isAuthModalOpen: boolean;
  fromCart: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openAuthModal: (fromCart?: boolean) => void;
  closeAuthModal: () => void;
}

export const useCartUI = create<CartUIState>((set) => ({
  isDrawerOpen: false,
  isAuthModalOpen: false,
  fromCart: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  openAuthModal: (fromCart = false) => set({ isAuthModalOpen: true, fromCart }),

  closeAuthModal: () => set({ isAuthModalOpen: false, fromCart: false }),
}));
