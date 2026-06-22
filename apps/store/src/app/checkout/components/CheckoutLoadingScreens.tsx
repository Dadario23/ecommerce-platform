"use client";

import Spinner from "@/components/ui/Spinner";
import { Package, ShieldCheck } from "lucide-react";

export function CheckoutInitLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1E3A8A] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-8 h-8 text-[#1E3A8A]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-800 font-semibold text-lg">
          Preparando todo para tu compra
        </p>
        <p className="text-gray-400 text-sm mt-1">Un momento...</p>
      </div>
    </div>
  );
}

export function CheckoutTransitionLoader({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1E3A8A] animate-spin" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export function CheckoutProcessingLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1E3A8A] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-[#1E3A8A]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-800 font-semibold text-lg">
          Procesando tu pedido
        </p>
        <p className="text-gray-400 text-sm mt-1">No cerrés esta ventana...</p>
      </div>
    </div>
  );
}

export function CheckoutEmptyCartView({ onGoToStore }: { onGoToStore: () => void }) {
  return (
    <div className="pt-20 md:pt-32 flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <p className="text-lg font-semibold text-gray-700 mb-4">
        No tenés productos en el carrito
      </p>
      <button
        onClick={onGoToStore}
        className="bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
      >
        Volver a la tienda
      </button>
    </div>
  );
}

// Re-export Spinner so callers can use it for the auth loading guard
export { Spinner };
