"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Download, Grid, List } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { ProductsLoading } from "@/components/dashboard/products/ProductsLoading";
import { ProductsStats } from "@/components/dashboard/products/ProductsStats";
import { ProductsFilters } from "@/components/dashboard/products/ProductsFilters";
import { ProductsBulkActions } from "@/components/dashboard/products/ProductsBulkActions";
import { ProductsTableView } from "@/components/dashboard/products/ProductsTableView";
import { ProductsGridView } from "@/components/dashboard/products/ProductsGridView";
import { ProductsPagination } from "@/components/dashboard/products/ProductsPagination";
import { ConfirmModal } from "@/components/dashboard/shared/ConfirmModal";
import { Product } from "@/types/product";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryName(category: unknown): string {
  if (!category) return "Sin categoría";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category)
    return (category as { name: string }).name;
  return "Sin categoría";
}

function getCategoryId(category: unknown): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "_id" in category)
    return String((category as { _id: string })._id);
  return "";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "all" | "published" | "inactive" | "low-stock" | "out-of-stock";

interface SortConfig { key: keyof Product; direction: "asc" | "desc"; }
interface Filters {
  search: string; category: string; status: string; stock: string;
  minPrice: string; maxPrice: string; minRating: string;
}

const TAB_FILTERS: Record<Tab, { status: string; stock: string }> = {
  "all":          { status: "all",      stock: "all" },
  "published":    { status: "active",   stock: "all" },
  "inactive":     { status: "inactive", stock: "all" },
  "low-stock":    { status: "all",      stock: "low-stock" },
  "out-of-stock": { status: "all",      stock: "out-of-stock" },
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all",          label: "Todos" },
  { key: "published",    label: "Publicados" },
  { key: "inactive",     label: "Inactivos" },
  { key: "low-stock",    label: "Stock bajo" },
  { key: "out-of-stock", label: "Sin stock" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<Filters>({
    search: "", category: "all", status: "all", stock: "all",
    minPrice: "", maxPrice: "", minRating: "0",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  // ── Data ──────────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error();
      const data: Product[] = await res.json();
      setProducts(data);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Carga las categorías desde la API para el filtro del select
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.categories)) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Reset page when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters.category, filters.status, filters.stock, filters.minPrice, filters.maxPrice, activeTab]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, Math.ceil(products.length / itemsPerPage))));
  }, [itemsPerPage, products.length]);

  // ── Derived data ──────────────────────────────────────────────────────────────

  // Tab counts (always from all products, unaffected by other filters)
  const tabCounts = useMemo<Record<Tab, number>>(() => ({
    all:           products.length,
    published:     products.filter((p) => p.isActive).length,
    inactive:      products.filter((p) => !p.isActive).length,
    "low-stock":   products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length,
    "out-of-stock": products.filter((p) => (p.stock ?? 0) === 0).length,
  }), [products]);

  const filteredAndSorted = useMemo(() => {
    const filtered = products.filter((p) => {
      const q = debouncedSearch.toLowerCase();
      return (
        (q === "" || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)) &&
        (filters.category === "all" || getCategoryId(p.category) === filters.category) &&
        (filters.status === "all" || (filters.status === "active" ? p.isActive : !p.isActive)) &&
        (filters.stock === "all" ||
          (filters.stock === "in-stock"     && (p.stock ?? 0) > 5) ||
          (filters.stock === "low-stock"    && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5) ||
          (filters.stock === "out-of-stock" && (p.stock ?? 0) === 0)) &&
        (!filters.minPrice || p.price >= Number(filters.minPrice)) &&
        (!filters.maxPrice || p.price <= Number(filters.maxPrice))
      );
    });

    filtered.sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];
      if (av === undefined || bv === undefined) return 0;
      if (typeof av === "string" && typeof bv === "string")
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === "number" && typeof bv === "number")
        return sortConfig.direction === "asc" ? av - bv : bv - av;
      return 0;
    });

    return filtered;
  }, [products, debouncedSearch, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => ({
    total:      products.length,
    active:     products.filter((p) => p.isActive).length,
    outOfStock: products.filter((p) => (p.stock || 0) === 0).length,
    lowStock:   products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length,
  }), [products]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    const { status, stock } = TAB_FILTERS[tab];
    setFilters((prev) => ({ ...prev, status, stock }));
  }

  const handleBulkAction = async (action: "delete" | "activate" | "deactivate") => {
    if (!selectedProducts.length) return;
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProducts, action }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Éxito", description: "Acción completada" });
      setSelectedProducts([]);
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "Error en la acción", variant: "destructive" });
    }
  };

  const handleEdit   = (id: string) => { window.location.href = `/dashboard/products/${id}/edit`; };
  const handleDelete = (id: string) => { setProductToDelete(id); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/products/${productToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Éxito", description: "Producto eliminado" });
      const newPages = Math.max(1, Math.ceil((filteredAndSorted.length - 1) / itemsPerPage));
      if (currentPage > newPages) setCurrentPage(newPages);
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "Error al eliminar", variant: "destructive" });
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleQuickEdit = async (id: string, field: keyof Product, value: unknown) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Actualizado" });
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "Error al actualizar", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const rows = [
      ["Nombre", "SKU", "Precio", "Stock", "Categoría", "Estado"].join(","),
      ...filteredAndSorted.map((p) =>
        `"${p.name}","${p.sku || ""}",${p.price},${p.stock || 0},"${getCategoryName(p.category)}","${p.isActive ? "Activo" : "Inactivo"}"`
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    a.download = "productos.csv";
    a.click();
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return <ProductsLoading />;

  return (
    <div className="space-y-5 max-w-7xl">
      <ProductsStats {...stats} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">
            {filteredAndSorted.length}{" "}
            {filteredAndSorted.length === 1 ? "producto" : "productos"}
            {filteredAndSorted.length !== products.length && (
              <span className="text-gray-400 font-normal"> de {products.length}</span>
            )}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            {!isMobile && (
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 transition-colors ${
                    viewMode === "table" ? "bg-[#1E3A8A] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Vista tabla"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 border-l border-gray-200 transition-colors ${
                    viewMode === "grid" ? "bg-[#1E3A8A] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Vista grilla"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-1.5 bg-[#1E3A8A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo producto
            </Link>
          </div>
        </div>

        {/* ── Status tabs ── */}
        <div className="flex gap-0 overflow-x-auto border-b border-gray-100">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-[#1E3A8A] text-[#1E3A8A]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                    isActive
                      ? "bg-[#1E3A8A]/10 text-[#1E3A8A]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div className="px-5 py-3.5 border-b border-gray-50">
          <ProductsFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />
        </div>

        {/* ── Bulk actions ── */}
        <ProductsBulkActions
          selectedCount={selectedProducts.length}
          onActivate={() => handleBulkAction("activate")}
          onDeactivate={() => handleBulkAction("deactivate")}
          onDelete={() => handleBulkAction("delete")}
        />

        {/* ── Content ── */}
        {isMobile || viewMode === "grid" ? (
          <ProductsGridView
            products={paginated}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProductsTableView
            products={paginated}
            selectedProducts={selectedProducts}
            onSelectProduct={setSelectedProducts}
            onQuickEdit={handleQuickEdit}
            sortConfig={sortConfig}
            onSort={setSortConfig}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* ── Pagination ── */}
        <div className="border-t border-gray-50 px-5 py-4">
          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filteredAndSorted.length}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar producto"
        description="¿Estás seguro de que querés eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
