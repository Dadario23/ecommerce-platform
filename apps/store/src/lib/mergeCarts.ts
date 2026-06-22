// lib/mergeCarts.ts
import { CartItem } from "@/store/useCartStore";

export function mergeCarts(
  localItems: CartItem[] = [],
  remoteItems: CartItem[] = []
): CartItem[] {
  const safeLocal = Array.isArray(localItems) ? localItems : [];
  const safeRemote = Array.isArray(remoteItems) ? remoteItems : [];

  const merged: CartItem[] = [...safeRemote];

  for (const localItem of safeLocal) {
    const existing = merged.find((item) => item.id === localItem.id);
    if (existing) {
      existing.quantity += localItem.quantity;
    } else {
      merged.push(localItem);
    }
  }

  return merged;
}
