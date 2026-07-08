"use client";

import Link from "next/link";
import { Truck, Zap, Globe, Clock, MessageCircle, LogIn, MapPin } from "lucide-react";
import { useShippingZone } from "@/hooks/useShippingZone";
import { useWhatsAppNumber } from "@/hooks/use-whatsapp-number";

interface Props {
  shippingTypes: string[];
  freeShipping?: boolean;
  shippingEnabled?: boolean;
}

function isBeforeNoon() {
  return new Date().getHours() < 12;
}

export default function ProductShippingCalculator({ shippingTypes, freeShipping = false, shippingEnabled = true }: Props) {
  const { zone, source, loading } = useShippingZone();
  const WHATSAPP = useWhatsAppNumber();

  const hasFlex     = shippingTypes.includes("flex");
  const hasStandard = shippingTypes.includes("standard");
  const today = isBeforeNoon();

  if (!shippingEnabled) {
    return (
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <Truck className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Opciones de envío</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Acordar con el vendedor</p>
              <p className="text-xs text-gray-500">Contactanos para coordinar el envío de tu pedido</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <Truck className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Opciones de envío</span>
        {source === "profile" && zone && (
          <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Según tu dirección · {zone.name}
          </span>
        )}
        {source === "ip" && zone && (
          <span className="ml-auto text-[10px] text-gray-400">
            Zona aproximada · {zone.name}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Cargando ── */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="h-14 bg-gray-100 rounded-xl" />
          </div>
        )}

        {/* ── Envío gratis — solo dentro del AMBA ── */}
        {!loading && freeShipping && zone && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-300 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">
                  {today ? "Llega gratis hoy" : "Llega gratis mañana"}
                </p>
                <p className="text-xs text-green-600">Envío sin cargo incluido</p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-700">GRATIS</span>
          </div>
        )}

        {/* ── Zona detectada (perfil o IP) con costo ── */}
        {!loading && !freeShipping && zone && (
          <>
            {hasFlex && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {today ? "Llega hoy" : "Llega mañana"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Envío flex
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-700">
                  ${zone.flex.toLocaleString("es-AR")}
                </span>
              </div>
            )}

            {hasStandard && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Llega en 2-3 días hábiles</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Envío estándar
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-700">
                  ${zone.standard.toLocaleString("es-AR")}
                </span>
              </div>
            )}

            {source === "ip" && (
              <p className="text-[11px] text-gray-400 text-center">
                Precio estimado para tu zona ·{" "}
                <Link href="/login" className="text-blue-500 hover:underline font-medium">
                  Ingresá para confirmar
                </Link>
              </p>
            )}
          </>
        )}

        {/* ── No logueado (sin zona detectada) ── */}
        {!loading && !zone && (source === "unknown" || source === null) && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="w-8 h-8 bg-(--tenant-primary) rounded-lg flex items-center justify-center shrink-0">
              <LogIn className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Iniciá sesión para ver el costo de envío</p>
              <p className="text-xs text-gray-500">Calculamos el precio según tu domicilio</p>
            </div>
            <Link href="/login"
              className="text-xs font-semibold text-white bg-(--tenant-primary) px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors shrink-0">
              Ingresar
            </Link>
          </div>
        )}

        {/* ── Sin dirección (logueado sin domicilio) ── */}
        {!loading && source === "no-address" && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Agregá tu domicilio para ver el costo de envío</p>
              <p className="text-xs text-gray-500">Calculamos el precio según tu zona</p>
            </div>
            <Link href="/account/addresses"
              className="text-xs font-semibold text-yellow-800 bg-yellow-200 hover:bg-yellow-300 px-3 py-1.5 rounded-lg transition-colors shrink-0">
              Agregar
            </Link>
          </div>
        )}

        {/* ── Fuera del AMBA — solo envío nacional ── */}
        {!loading && source === "ip" && !zone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Envío al interior del país</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Por Correo Arg / Andreani / OCA · 5-10 días hábiles
                  </p>
                </div>
              </div>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                <MessageCircle className="w-3.5 h-3.5" /> Consultar
              </a>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
