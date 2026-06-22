"use client";

import { ChevronLeft, MapPin, Truck, Package, Zap } from "lucide-react";
import type { ShippingType } from "../types";
import { addBusinessDays, formatDateLong } from "../helpers";

interface CheckoutStepDateProps {
  shippingEnabled: boolean;
  shippingType: ShippingType;
  today: Date;
  onContinue: () => void;
  onBack: () => void;
}

export default function CheckoutStepDate({
  shippingEnabled,
  shippingType,
  today,
  onContinue,
  onBack,
}: CheckoutStepDateProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>
      <h1 className="text-xl font-bold text-gray-900">
        {shippingEnabled ? "¿Cuándo llega tu compra?" : "¿Cómo coordinamos la entrega?"}
      </h1>

      {/* Retiro / punto acordado */}
      {!shippingEnabled && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Retiro / punto acordado</p>
              <p className="text-xs text-gray-500 mt-0.5">A coordinar con el vendedor</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 font-medium">
              Una vez confirmado el pedido, te contactamos por teléfono o email para acordar
              el lugar y horario de retiro o entrega.
            </p>
          </div>
        </div>
      )}

      {/* Flex */}
      {shippingEnabled && shippingType === "flex" && (() => {
        const isBeforeNoon = new Date().getHours() < 12;
        return (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {isBeforeNoon ? "Llega hoy" : "Llega mañana"}
                </p>
                <p className="text-xs text-gray-500">
                  {isBeforeNoon
                    ? "Pedidos antes de las 12hs tienen entrega en el día"
                    : "Tu pedido saldrá mañana temprano"}
                </p>
              </div>
            </div>
            <p className="text-xs text-green-700 font-medium">
              Si no vas a estar en casa podés reprogramarlo desde{" "}
              <span className="underline">Mis compras</span> una vez confirmado el pedido.
            </p>
          </div>
        );
      })()}

      {/* Estándar */}
      {shippingEnabled && shippingType === "standard" && (() => {
        const estimatedFrom = addBusinessDays(today, 3);
        const estimatedTo = addBusinessDays(today, 5);
        return (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Llega entre el {formatDateLong(estimatedFrom)} y el{" "}
                  {formatDateLong(estimatedTo)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  3 a 5 días hábiles desde la confirmación
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700 font-medium">
                Con el envío estándar, la logística programa la entrega según la ruta del día.
                No es posible elegir un horario o día exacto.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Nacional */}
      {shippingEnabled && shippingType !== "flex" && shippingType !== "standard" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Envío al interior del país</p>
              <p className="text-xs text-gray-500 mt-0.5">5 a 10 días hábiles estimados</p>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
            <p className="text-xs text-purple-700 font-medium">
              Coordinaremos el envío con el correo. Te avisaremos por email cuando el paquete
              sea despachado.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="w-full bg-[#1E3A8A] hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors mt-2"
      >
        Continuar
      </button>
    </div>
  );
}
