"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight, SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
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
  category: string;
}

type SortOption = "relevant" | "price-asc" | "price-desc" | "discount";

const SORT_LABELS: Record<SortOption, string> = {
  relevant: "Más relevantes",
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  discount: "Mayor descuento",
};

const ITEMS_PER_PAGE = 12;

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

interface Props {
  shippingEnabled?: boolean;
  gridCards?: boolean;
}

export default function SearchClient({ shippingEnabled = true, gridCards = false }: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const shippingZone = useShippingZone();

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevant");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    fetch(`/api/products/search?query=${encodeURIComponent(query)}&mode=full`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setPage(1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  const availableBrands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand).filter(Boolean) as string[])
      ).sort(),
    [products]
  );

  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const [filters, setFilters] = useState<ActiveFilters>({
    brands: [],
    minPrice: 0,
    maxPrice: Infinity,
    inStockOnly: false,
    condition: "all",
    shipping: "all",
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, minPrice: priceRange.min, maxPrice: priceRange.max }));
  }, [priceRange.min, priceRange.max]);

  const handleFilterChange = (next: ActiveFilters) => {
    setFilters(next);
    setPage(1);
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (filters.inStockOnly && (p.stock ?? 0) <= 0) return false;
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand)))
        return false;
      if (filters.condition !== "all" && (p.condition ?? "new") !== filters.condition)
        return false;
      if (filters.shipping !== "all" && !(p.shippingTypes ?? ["flex","standard"]).includes(filters.shipping))
        return false;
      return true;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "discount")
      list = [...list].sort((a, b) => {
        const da = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const db = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return db - da;
      });

    // Envío gratis siempre primero
    return [
      ...list.filter((p) => p.freeShipping),
      ...list.filter((p) => !p.freeShipping),
    ];
  }, [products, filters, sort]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const activeFilterCount =
    filters.brands.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.condition !== "all" ? 1 : 0) +
    (filters.shipping !== "all" ? 1 : 0) +
    (filters.minPrice > priceRange.min || filters.maxPrice < priceRange.max ? 1 : 0);

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-3">
          <Link href="/" className="hover:text-(--tenant-primary) flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-800 font-medium truncate max-w-50">
            &ldquo;{query}&rdquo;
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Resultados para{" "}
              <span className="text-(--tenant-primary)">&ldquo;{query}&rdquo;</span>
            </h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
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

            {/* Sort dropdown */}
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
                    <button
                      key={key}
                      onClick={() => {
                        setSort(key);
                        setSortOpen(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sort === key
                          ? "bg-blue-50 text-(--tenant-primary) font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
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
            <FiltersSidebar
              availableBrands={availableBrands}
              priceRange={priceRange}
              filters={filters}
              onChange={handleFilterChange}
            />
          </aside>

          {/* Results */}
          <section className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className={gridCards ? "grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8" : "flex flex-col gap-3"}>
                {paginatedProducts.map((product) => (
                  <CategoryProductCard key={product._id} product={product} listView={!gridCards} shippingZone={shippingZone} shippingEnabled={shippingEnabled} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold text-lg mb-1">
                  {query
                    ? `Sin resultados para "${query}"`
                    : "Ingresá un término de búsqueda"}
                </p>
                <p className="text-gray-400 text-sm mb-5">
                  {query
                    ? "Probá con otras palabras o revisá la ortografía"
                    : "Usá el buscador del menú para encontrar productos"}
                </p>
                {query && activeFilterCount > 0 && (
                  <button
                    onClick={() =>
                      handleFilterChange({
                        brands: [],
                        minPrice: priceRange.min,
                        maxPrice: priceRange.max,
                        inStockOnly: false,
                        condition: "all",
    shipping: "all",
                      })
                    }
                    className="text-sm text-(--tenant-primary) font-medium hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
                <Link
                  href="/"
                  className="mt-3 text-sm text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Volver al inicio
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={page === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b sticky top-0 bg-white z-10">
              <span className="font-semibold text-gray-900">Filtros</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FiltersSidebar
                availableBrands={availableBrands}
                priceRange={priceRange}
                filters={filters}
                onChange={handleFilterChange}
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t px-4 py-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-(--tenant-primary) text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors"
              >
                Ver {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
