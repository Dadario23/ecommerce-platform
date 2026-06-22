"use client";

import { CreditCard, CheckCircle2 } from "lucide-react";
import { INSTALLMENTS } from "@/config/installments";

function ars(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function InstallmentsInfo({ price }: { price: number }) {
  const { max, sinInteres, plans } = INSTALLMENTS;

  if (sinInteres) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Hasta {max} cuotas sin interés</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {plans.map((n) => (
            <span key={n} className="text-sm text-green-800">
              <span className="font-bold">{n}x</span>{" "}
              {ars(Math.ceil(price / n))}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Phase 1 — con interés, solo comunicación visual
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 text-blue-700">
        <CreditCard className="w-4 h-4 shrink-0" />
        <span className="text-sm font-semibold">Hasta {max} cuotas con tarjeta</span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {plans.map((n) => (
          <span key={n} className="text-sm text-blue-800">
            <span className="font-bold">{n}x</span>{" "}
            {ars(Math.ceil(price / n))}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-blue-400 leading-tight">
        Montos estimados. El interés lo define tu banco al momento del pago.
      </p>
    </div>
  );
}
