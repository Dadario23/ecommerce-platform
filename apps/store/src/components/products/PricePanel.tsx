// components/product/PricePanel.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function money(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PricePanel({
  price,
  compareAtPrice,
}: {
  price: number;
  compareAtPrice?: number;
}) {
  const hasCompare =
    typeof compareAtPrice === "number" && compareAtPrice! > price;
  const discount = hasCompare
    ? Math.round(100 - (price / (compareAtPrice as number)) * 100)
    : null;

  const cuotas6 = price / 6;
  const cuotas10 = price / 10;

  return (
    <div className="space-y-3">
      {/* Precio y descuento */}
      <div>
        {hasCompare ? (
          <p className="text-sm text-gray-500 line-through">
            {money(compareAtPrice!)}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold text-gray-900">{money(price)}</p>
          {discount ? (
            <Badge className="bg-red-600 hover:bg-red-700">
              {discount}% OFF
            </Badge>
          ) : null}
        </div>
        {hasCompare ? (
          <p className="text-xs text-gray-500">
            Precio sin impuestos nacionales: {money(Math.round(price * 0.825))}
          </p>
        ) : null}
      </div>

      {/* Cuotas */}
      <div className="text-sm">
        <p>
          <strong>10 cuotas</strong> de {money(cuotas10)}{" "}
          <span className="text-orange-600">NaranjaX</span>
        </p>
        <p>
          <strong>6 cuotas</strong> de {money(cuotas6)}{" "}
          <span className="text-gray-600">con Hipotecario</span>
        </p>
      </div>

      <Button size="lg" className="w-full">
        COMPRAR
      </Button>
    </div>
  );
}
