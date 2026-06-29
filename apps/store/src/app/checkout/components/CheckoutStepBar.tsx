"use client";

import { Check } from "lucide-react";
import type { WizardStep } from "../types";

interface CheckoutStepBarProps {
  step: WizardStep;
}

export default function CheckoutStepBar({ step }: CheckoutStepBarProps) {
  const activeIdx: Record<WizardStep, number> = {
    "init-loading": -1,
    delivery: 0,
    "trans-date": 1,
    date: 1,
    "trans-payment": 2,
    payment: 2,
    review: 3,
  };
  const active = activeIdx[step];
  const labels = ["Entrega", "Fecha", "Pago", "Confirmá"];

  return (
    <div className="flex items-start justify-center mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < active
                  ? "bg-green-500 text-white"
                  : i === active
                    ? "bg-(--tenant-primary) text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < active ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-medium leading-none ${
                i === active
                  ? "text-(--tenant-primary)"
                  : i < active
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < 3 && (
            <div
              className={`w-10 sm:w-16 h-0.5 mx-1 mb-5 ${
                i < active ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
