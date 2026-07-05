"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

export interface ActiveFilters {
  brands: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  condition: "all" | "new" | "used";
  shipping: "all" | "flex" | "standard";
}

interface FiltersSidebarProps {
  availableBrands: string[];
  priceRange: { min: number; max: number };
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
}

export default function FiltersSidebar({
  availableBrands,
  priceRange,
  filters,
  onChange,
}: FiltersSidebarProps) {
  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: next });
  };

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.inStockOnly ||
    filters.condition !== "all" ||
    filters.shipping !== "all" ||
    filters.minPrice > priceRange.min ||
    filters.maxPrice < priceRange.max;

  const resetFilters = () => {
    onChange({
      brands: [],
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      inStockOnly: false,
      condition: "all",
      shipping: "all",
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm sticky top-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-sm text-gray-800">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-(--tenant-primary) hover:text-(--tenant-primary-hover) font-medium transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Precio */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Precio
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1.5 block">Mínimo</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChange({ ...filters, minPrice: isNaN(val) ? priceRange.min : val });
                  }}
                  min={priceRange.min}
                  max={filters.maxPrice}
                  className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--tenant-primary)/20 focus:border-(--tenant-primary)/50"
                />
              </div>
            </div>
            <span className="text-gray-300 mt-5 text-lg">–</span>
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1.5 block">Máximo</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChange({ ...filters, maxPrice: isNaN(val) ? priceRange.max : val });
                  }}
                  min={filters.minPrice}
                  max={priceRange.max}
                  className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--tenant-primary)/20 focus:border-(--tenant-primary)/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-100" />

        {/* Condición */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Condición
          </p>
          <div className="flex gap-2">
            {(["all", "new", "used"] as const).map((val) => {
              const labels = { all: "Todos", new: "Nuevo", used: "Usado" };
              const active = filters.condition === val;
              return (
                <button
                  key={val}
                  onClick={() => onChange({ ...filters, condition: val })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {labels[val]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Tipo de envío */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Tipo de envío
          </p>
          <div className="flex gap-2">
            {(["all", "flex", "standard"] as const).map((val) => {
              const labels = { all: "Todos", flex: "⚡ Flex", standard: "🚚 Estándar" };
              const active = filters.shipping === val;
              return (
                <button
                  key={val}
                  onClick={() => onChange({ ...filters, shipping: val })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {labels[val]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Stock */}
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="inStock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked: boolean | "indeterminate") =>
              onChange({ ...filters, inStockOnly: checked === true })
            }
          />
          <Label htmlFor="inStock" className="text-sm text-gray-700 cursor-pointer select-none">
            Solo con stock disponible
          </Label>
        </div>

        {/* Marcas */}
        {availableBrands.length > 0 && (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Marca
              </p>
              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                {availableBrands.map((brand) => (
                  <div key={brand} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.brands.includes(brand)}
                      onCheckedChange={() => toggleBrand(brand)}
                    />
                    <Label
                      htmlFor={`brand-${brand}`}
                      className="text-sm text-gray-700 cursor-pointer select-none"
                    >
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
