"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";

// Sincroniza el store local con los favoritos del servidor al iniciar sesión.
// Se monta una sola vez en el Navbar para que esté disponible en toda la app.
export function useFavoritesSync() {
  const { data: session, status } = useSession();
  const { hydrate, clear } = useFavoritesStore();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.email) {
      clear();
      return;
    }

    fetch("/api/user/favorites")
      .then((r) => r.json())
      .then((ids: string[]) => { if (Array.isArray(ids)) hydrate(ids); })
      .catch(() => {});
  }, [status, session?.user?.email, hydrate, clear]);
}
