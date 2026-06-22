"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";

/**
 * Hook para unificar carrito local (guest) y carrito en backend (usuario logueado).
 * - Siempre usa Zustand como fuente de verdad.
 * - Si hay sesión → sincroniza con backend.
 * - Si no hay sesión → Zustand ya se persiste solo en localStorage (gracias a persist).
 */
export function useCartWithSession() {
  const { data: session, status } = useSession();
  const { items, setItems } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Cargar carrito desde la DB cuando el usuario se loguea
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (res.ok && Array.isArray(data.items)) {
          // ✅ reemplazar Zustand con lo que tenga el backend
          setItems(data.items);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error cargando carrito:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [status, setItems]);

  // 🔹 Sincronizar cada cambio en items con backend (solo si hay sesión)
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user) return;

    const persistCart = async () => {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } catch (err) {
        console.error("Error guardando carrito:", err);
      }
    };

    persistCart();
  }, [items, status, session?.user]);

  return { items, isLoading };
}
