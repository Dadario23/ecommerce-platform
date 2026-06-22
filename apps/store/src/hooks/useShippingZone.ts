"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface ShippingZone {
  id: string;
  name: string;
  localities: string[];
  flex: number;
  standard: number;
}

export type ZoneSource = "profile" | "ip" | "no-address" | "unknown" | "error" | null;

export interface ShippingZoneResult {
  zone: ShippingZone | null;
  source: ZoneSource;
  loading: boolean;
}

const CACHE_KEY = "shipping_zone_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const INVALIDATE_EVENT = "shipping-zone-invalidated";

/** Llamar después de guardar/eliminar una dirección para forzar re-detección */
export function clearShippingZoneCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INVALIDATE_EVENT));
  }
}

interface CacheEntry {
  zone: ShippingZone | null;
  source: ZoneSource;
  email: string | null;
  ts: number;
}

/**
 * Solo en desarrollo: simular zona desde la consola del navegador.
 * Ejemplos:
 *   localStorage.setItem('shipping_zone_test', 'outside-amba')  → fuera del AMBA
 *   localStorage.setItem('shipping_zone_test', 'no-address')    → logueado sin dirección
 *   localStorage.setItem('shipping_zone_test', 'unknown')       → no logueado
 *   localStorage.removeItem('shipping_zone_test')               → comportamiento real
 */
const TEST_KEY = "shipping_zone_test";

export function useShippingZone(): ShippingZoneResult {
  const { data: session, status } = useSession();
  const [result, setResult] = useState<ShippingZoneResult>({ zone: null, source: null, loading: true });
  const [refreshKey, setRefreshKey] = useState(0);

  // Re-fetcha cuando se invalida el cache desde cualquier componente
  useEffect(() => {
    const invalidate = () => setRefreshKey((k) => k + 1);
    window.addEventListener(INVALIDATE_EVENT, invalidate);
    return () => window.removeEventListener(INVALIDATE_EVENT, invalidate);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    // Override de testing (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      try {
        const testMode = localStorage.getItem(TEST_KEY);
        if (testMode === "outside-amba") {
          setResult({ zone: null, source: "ip", loading: false });
          return;
        }
        if (testMode === "no-address") {
          setResult({ zone: null, source: "no-address", loading: false });
          return;
        }
        if (testMode === "unknown") {
          setResult({ zone: null, source: "unknown", loading: false });
          return;
        }
      } catch { /* ignore */ }
    }

    const email = session?.user?.email ?? null;

    // Leer caché
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CacheEntry = JSON.parse(raw);
        const fresh = Date.now() - cached.ts < CACHE_TTL;
        const sameUser = cached.email === email;
        if (fresh && sameUser) {
          setResult({ zone: cached.zone, source: cached.source, loading: false });
          return;
        }
      }
    } catch { /* ignore */ }

    // Detectar zona
    fetch("/api/shipping/my-zone")
      .then((r) => r.json())
      .then(({ zone, source }) => {
        setResult({ zone, source, loading: false });
        try {
          const entry: CacheEntry = { zone, source, email, ts: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
        } catch { /* ignore */ }
      })
      .catch(() => setResult({ zone: null, source: "error", loading: false }));
  }, [status, session?.user?.email, refreshKey]);

  return result;
}
