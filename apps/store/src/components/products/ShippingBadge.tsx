"use client";

import Link from "next/link";
import { ShippingZone, ZoneSource } from "@/hooks/useShippingZone";

interface Props {
  freeShipping: boolean;
  shippingTypes: string[];
  zone: ShippingZone | null;
  source: ZoneSource;
  loading: boolean;
  size?: "sm" | "md";
  /** true cuando el badge está dentro de un <a> (card) — evita anidar <a> dentro de <a> */
  inCard?: boolean;
}

function isBeforeNoon() {
  return new Date().getHours() < 12;
}

export default function ShippingBadge({
  freeShipping,
  shippingTypes,
  zone,
  source,
  loading,
  size = "sm",
  inCard = false,
}: Props) {
  const text = size === "sm" ? "text-[11px]" : "text-xs";
  const hasFlex = shippingTypes.includes("flex");
  const hasStandard = shippingTypes.includes("standard");

  if (loading) {
    return <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />;
  }

  // ── Fuera del AMBA (IP sin zona) — solo envío nacional ──────────────────
  if (source === "ip" && !zone) {
    return (
      <span className={`${text} text-gray-400`}>
        Envío al interior disponible
      </span>
    );
  }

  // ── Envío gratis — solo dentro del AMBA ──────────────────────────────────
  if (freeShipping && zone) {
    const today = isBeforeNoon();
    return (
      <span className={`${text} font-semibold text-green-700`}>
        {today ? "Llega gratis hoy" : "Llega gratis mañana"}
      </span>
    );
  }

  // ── Zona detectada (AMBA) ─────────────────────────────────────────────────
  if (zone) {
    if (hasFlex) {
      const today = isBeforeNoon();
      return (
        <span className={`${text} font-semibold text-green-700`}>
          {today ? "Llega hoy" : "Llega mañana"} · $
          {zone.flex.toLocaleString("es-AR")}
        </span>
      );
    }
    if (hasStandard) {
      return (
        <span className={`${text} font-semibold text-blue-700`}>
          🚚 Envío estándar · ${zone.standard.toLocaleString("es-AR")}
        </span>
      );
    }
    return null;
  }

  // ── Sin dirección (logueado sin domicilio) ────────────────────────────────
  if (source === "no-address") {
    if (inCard) {
      return (
        <span className={`${text} text-gray-400`}>
          Agregá tu domicilio para ver envíos
        </span>
      );
    }
    return (
      <Link
        href="/account/addresses"
        className={`${text} font-medium text-blue-600 hover:underline`}
      >
        Agregá tu domicilio para ver envíos
      </Link>
    );
  }

  // ── No logueado ───────────────────────────────────────────────────────────
  if (source === "unknown" || source === null) {
    if (inCard) {
      return (
        <span className={`${text} text-gray-400`}>
          Iniciá sesión para ver envíos
        </span>
      );
    }
    return (
      <Link
        href="/login"
        className={`${text} font-medium text-blue-600 hover:underline`}
      >
        Iniciá sesión para ver envíos
      </Link>
    );
  }

  // ── Zona fuera de cobertura ───────────────────────────────────────────────
  return (
    <span className={`${text} text-gray-400`}>Consultá opciones de envío</span>
  );
}
