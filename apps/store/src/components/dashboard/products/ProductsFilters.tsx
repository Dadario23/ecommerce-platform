// src/components/dashboard/products/ProductsFilters.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { normalizeCategories, CategoryOption } from "@/lib/normalizeCategories";

interface Filters {
  search: string;
  category: string;
  status: string;
  stock: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
}

interface ProductsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
  className?: string;
}

export function ProductsFilters({
  filters,
  onFiltersChange,
  categories,
}: ProductsFiltersProps) {
  const [showMore, setShowMore] = useState(false);

  const normalizedCategories: CategoryOption[] = normalizeCategories(categories);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "";

  const hasAdvancedFilters = filters.minPrice !== "" || filters.maxPrice !== "";

  function clearFilters() {
    onFiltersChange({
      ...filters,
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      minRating: "0",
    });
    setShowMore(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            className="pl-9 h-9"
            placeholder="Buscar por nombre o SKU..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {normalizedCategories.map((cat, idx) => (
              <SelectItem key={cat._id || `cat-${idx}`} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Más filtros */}
        <button
          type="button"
          onClick={() => setShowMore((p) => !p)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 h-9 border rounded-lg transition-colors ${
            showMore || hasAdvancedFilters
              ? "border-(--tenant-primary) text-(--tenant-primary) bg-blue-50"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Más filtros
          {hasAdvancedFilters && (
            <span className="w-4 h-4 rounded-full bg-(--tenant-primary) text-white text-[9px] flex items-center justify-center">
              !
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 px-2 h-9 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Más filtros: rango de precio */}
      {showMore && (
        <div className="flex gap-2 items-center pt-1">
          <span className="text-xs text-gray-500 font-medium shrink-0">Precio:</span>
          <Input
            type="number"
            placeholder="Mínimo"
            value={filters.minPrice}
            onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
            className="w-32 h-9"
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="number"
            placeholder="Máximo"
            value={filters.maxPrice}
            onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
            className="w-32 h-9"
          />
        </div>
      )}
    </div>
  );
}
