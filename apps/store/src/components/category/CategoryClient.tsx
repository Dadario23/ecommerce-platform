"use client";

import Link from "next/link";
import { Home, ChevronRight, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import FiltersSidebar, { ActiveFilters } from "@/components/category/FiltersSidebar";
import CategoryProductCard from "@/components/category/CategoryProductCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useMemo, useState } from "react";
import { useShippingZone } from "@/hooks/useShippingZone";

interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  stock?: number;
  condition?: "new" | "used";
  shippingTypes?: string[];
  freeShipping?: boolean;
}

interface CategoryClientProps {
  categoryName: string;
  initialProducts: Product[];
  shippingEnabled?: boolean;
  gridCards?: boolean;
}

type SortOption = "newest" | "price-asc" | "price-desc" | "discount";

const SORT_LABELS: Record<SortOption, string> = {
  newest:       "Más nuevos",
  "price-asc":  "Menor precio",
  "price-desc": "Mayor precio",
  discount:     "Mayor descuento",
};

const ITEMS_PER_PAGE = 12;

export default function CategoryClient({ categoryName, initialProducts, shippingEnabled = true, gridCards = false }: CategoryClientProps) {
  const [page, setPage]                   = useState(1);
  const [sort, setSort]                   = useState<SortOption>("newest");
  const [sortOpen, setSortOpen]           = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const shippingZone = useShippingZone();

  const availableBrands = useMemo(
    () => Array.from(new Set(initialProducts.map((p) => p.brand).filter(Boolean) as string[])).sort(),
    [initialProducts],
  );

  const priceRange = useMemo(() => {
    if (!initialProducts.length) return { min: 0, max: 0 };
    const prices = initialProducts.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [initialProducts]);

  const [filters, setFilters] = useState<ActiveFilters>({
    brands: [],
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    inStockOnly: false,
    condition: "all",
    shipping: "all",
  });

  const handleFilterChange = (next: ActiveFilters) => { setFilters(next); setPage(1); };

  const filteredProducts = useMemo(() => {
    let list = initialProducts.filter((p) => {
      if (filters.inStockOnly && (p.stock ?? 0) <= 0) return false;
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand))) return false;
      if (filters.condition !== "all" && (p.condition ?? "new") !== filters.condition) return false;
      if (filters.shipping !== "all" && !(p.shippingTypes ?? ["flex","standard"]).includes(filters.shipping)) return false;
      return true;
    });
    if (sort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "discount") list = [...list].sort((a, b) => {
      const da = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
      const db = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
      return db - da;
    });

    // Envío gratis siempre primero
    return [
      ...list.filter((p) => p.freeShipping),
      ...list.filter((p) => !p.freeShipping),
    ];
  }, [initialProducts, filters, sort]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilterCount =
    filters.brands.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.condition !== "all" ? 1 : 0) +
    (filters.shipping !== "all" ? 1 : 0) +
    (filters.minPrice > priceRange.min || filters.maxPrice < priceRange.max ? 1 : 0);

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-3">
          <Link href="/" className="hover:text-(--tenant-primary) flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-800 font-medium">{categoryName}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white shadow-sm hover:border-blue-300 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-(--tenant-primary) text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white shadow-sm hover:border-blue-300 transition-colors"
              >
                <span className="text-gray-700">{SORT_LABELS[sort]}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button key={key} onClick={() => { setSort(key); setSortOpen(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === key ? "bg-(--tenant-tint) text-(--tenant-primary) font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar desktop */}
          <aside className="w-60 hidden md:block shrink-0">
            <FiltersSidebar availableBrands={availableBrands} priceRange={priceRange} filters={filters} onChange={handleFilterChange} />
          </aside>

          {/* Products — lista 1 por fila, o grilla si gridCards */}
          <section className="flex-1 min-w-0">
            {paginatedProducts.length > 0 ? (
              <div className={gridCards ? "grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8" : "flex flex-col gap-3"}>
                {paginatedProducts.map((product) => (
                  <CategoryProductCard
                    key={product._id}
                    product={product}
                    listView={!gridCards}
                    shippingZone={shippingZone}
                    shippingEnabled={shippingEnabled}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <SlidersHorizontal className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-600 font-medium mb-1">No hay productos con esos filtros</p>
                <p className="text-gray-400 text-sm mb-4">Probá cambiando los criterios de búsqueda</p>
                <button
                  onClick={() => handleFilterChange({ brands: [], minPrice: priceRange.min, maxPrice: priceRange.max, inStockOnly: false, condition: "all", shipping: "all" })}
                  className="text-sm text-(--tenant-primary) font-medium hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b sticky top-0 bg-white z-10">
              <span className="font-semibold text-gray-900">Filtros</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FiltersSidebar availableBrands={availableBrands} priceRange={priceRange} filters={filters} onChange={handleFilterChange} />
            </div>
            <div className="sticky bottom-0 bg-white border-t px-4 py-4">
              <button onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-(--tenant-primary) text-white font-semibold py-3 rounded-xl hover:bg-(--tenant-primary-hover) transition-colors">
                Ver {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
