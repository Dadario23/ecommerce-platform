"use client";

import { Input } from "@/components/ui/input";
import { ChevronLeft, CreditCard, Package, Banknote, Tag, X, Check } from "lucide-react";
import type { DeliveryMethod, PaymentMethod } from "../types";

interface CheckoutStepPaymentProps {
  shippingEnabled: boolean;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  couponError: string;
  couponDiscount: number;
  appliedCoupon: string;
  checkingCoupon: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function CheckoutStepPayment({
  shippingEnabled,
  deliveryMethod,
  paymentMethod,
  onPaymentMethodChange,
  couponCode,
  onCouponCodeChange,
  couponError,
  couponDiscount,
  appliedCoupon,
  checkingCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onContinue,
  onBack,
}: CheckoutStepPaymentProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>
      <h1 className="text-xl font-bold text-gray-900">Elegí cómo pagar</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        {deliveryMethod === "domicilio" ? (
          /* Domicilio → solo Mercado Pago */
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#1E3A8A] bg-blue-50">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">Mercado Pago</p>
              <p className="text-xs text-gray-500">Tarjeta, transferencia, cuotas sin interés</p>
            </div>
            <Check className="w-5 h-5 text-[#1E3A8A] shrink-0" />
          </div>
        ) : (
          /* Contraentrega o Retiro → Mercado Pago, Efectivo o Transferencia */
          <>
            <button
              type="button"
              onClick={() => onPaymentMethodChange("mercadopago")}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === "mercadopago"
                  ? "border-[#1E3A8A] bg-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === "mercadopago" ? "bg-[#1E3A8A]" : "bg-gray-100"
                }`}
              >
                <CreditCard
                  className={`w-5 h-5 ${
                    paymentMethod === "mercadopago" ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Mercado Pago</p>
                <p className="text-xs text-gray-500">Tarjeta, transferencia, cuotas sin interés</p>
              </div>
              {paymentMethod === "mercadopago" && (
                <Check className="w-5 h-5 text-[#1E3A8A] shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodChange("cash")}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === "cash"
                  ? "border-[#1E3A8A] bg-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === "cash" ? "bg-[#1E3A8A]" : "bg-gray-100"
                }`}
              >
                <Package
                  className={`w-5 h-5 ${
                    paymentMethod === "cash" ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">
                  {shippingEnabled ? "Efectivo al recibir" : "Efectivo en el encuentro"}
                </p>
                <p className="text-xs text-gray-500">
                  {shippingEnabled
                    ? "Pagás en efectivo cuando el envío llega a tu casa"
                    : "Pagás en efectivo al retirar o en el punto acordado"}
                </p>
              </div>
              {paymentMethod === "cash" && (
                <Check className="w-5 h-5 text-[#1E3A8A] shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodChange("transfer")}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === "transfer"
                  ? "border-[#1E3A8A] bg-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === "transfer" ? "bg-[#1E3A8A]" : "bg-gray-100"
                }`}
              >
                <Banknote
                  className={`w-5 h-5 ${
                    paymentMethod === "transfer" ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Transferencia bancaria</p>
                <p className="text-xs text-gray-500">Te enviamos los datos por email al confirmar</p>
              </div>
              {paymentMethod === "transfer" && (
                <Check className="w-5 h-5 text-[#1E3A8A] shrink-0" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Cupón */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Cupón de descuento
        </p>
        {appliedCoupon ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Tag className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-700 font-medium flex-1">
              {appliedCoupon} — −${couponDiscount.toLocaleString("es-AR")}
            </span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-green-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
              placeholder="INGRESÁ TU CÓDIGO"
              className="uppercase tracking-widest font-mono rounded-lg"
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), onApplyCoupon())
              }
            />
            <button
              type="button"
              onClick={onApplyCoupon}
              disabled={checkingCoupon || !couponCode.trim()}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:border-blue-300 hover:text-[#1E3A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {checkingCoupon ? "..." : "Aplicar"}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-xs text-red-500 mt-2">{couponError}</p>
        )}
      </div>

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
