"use client";

import Image from "next/image";
import Spinner from "@/components/ui/Spinner";
import { safeImageSrc } from "@/lib/safe-image-src";
import { Truck, CreditCard, Lock, ShieldCheck, ChevronLeft } from "lucide-react";
import type { AddressData, CartItem, DeliveryMethod, PaymentMethod, ShippingType, ShippingZone } from "../types";
import { addBusinessDays, formatDateLong } from "../helpers";

interface CheckoutStepReviewProps {
  shippingEnabled: boolean;
  items: CartItem[];
  address: AddressData;
  deliveryMethod: DeliveryMethod;
  shippingType: ShippingType;
  detectedZone: ShippingZone | null;
  shippingCost: number;
  subtotal: number;
  couponDiscount: number;
  appliedCoupon: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  today: Date;
  isProcessing: boolean;
  errorMsg: string;
  onConfirm: () => void;
  onBack: () => void;
}

export default function CheckoutStepReview({
  shippingEnabled,
  items,
  address,
  deliveryMethod,
  shippingType,
  detectedZone,
  shippingCost,
  subtotal,
  couponDiscount,
  appliedCoupon,
  total,
  paymentMethod,
  paymentLabel,
  today,
  isProcessing,
  errorMsg,
  onConfirm,
  onBack,
}: CheckoutStepReviewProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>
      <h1 className="text-xl font-bold text-gray-900">Revisá y confirmá</h1>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-sm text-gray-800">Detalle del pedido</p>
        </div>
        <ul className="divide-y divide-gray-50 px-5">
          {items.map((item: CartItem) => (
            <li key={item.size ? `${item.id}::${item.size}` : item.id} className="flex items-center gap-3 py-3">
              <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <Image
                  src={safeImageSrc(item.image, "/placeholder-category.jpg")}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.size && (
                    <span className="font-medium text-gray-500">Talle {item.size} · </span>
                  )}
                  {item.quantity} × ${item.price.toLocaleString("es-AR")}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 shrink-0">
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Delivery + payment + totals */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3 pb-4 border-b border-gray-50">
          <Truck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Entrega
            </p>
            {shippingEnabled ? (
              <>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {deliveryMethod === "domicilio" ? "Envío a domicilio" : "Contraentrega"}
                </p>
                <p className="text-xs text-gray-500">
                  {address.street}, {address.city}, {address.state}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {shippingType === "flex"
                    ? new Date().getHours() < 12
                      ? "Llega hoy"
                      : "Llega mañana"
                    : shippingType === "standard"
                      ? `Estimado: ${formatDateLong(addBusinessDays(today, 3))} – ${formatDateLong(addBusinessDays(today, 5))}`
                      : "5-10 días hábiles · coordinamos con el correo"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  Retiro / punto acordado
                </p>
                <p className="text-xs text-gray-400 mt-0.5">A coordinar con el vendedor</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 pb-4 border-b border-gray-50">
          <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Pago
            </p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{paymentLabel}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString("es-AR")}</span>
          </div>
          {shippingEnabled ? (
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Envío {shippingType === "flex" ? "flex" : "estándar"}
                {detectedZone && (
                  <span className="text-gray-400"> · {detectedZone.name}</span>
                )}
              </span>
              {shippingCost === 0 ? (
                <span className="text-green-600 font-medium">Gratis</span>
              ) : (
                <span className="font-medium">${shippingCost.toLocaleString("es-AR")}</span>
              )}
            </div>
          ) : (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Envío</span>
              <span className="text-green-600 font-medium">Sin costo</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Descuento ({appliedCoupon})</span>
              <span>−${couponDiscount.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>${total.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm whitespace-pre-line">
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={isProcessing}
        className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {isProcessing ? (
          <>
            <Spinner />
            <span>Procesando...</span>
          </>
        ) : (
          <span>
            {paymentMethod === "mercadopago"
              ? "Confirmar y pagar con Mercado Pago"
              : "Confirmar pedido"}
          </span>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-2">
        <Lock className="w-3.5 h-3.5" />
        Pago seguro con encriptación SSL
        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
      </div>
    </div>
  );
}
