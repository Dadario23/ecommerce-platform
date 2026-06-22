"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, X, Plus, Edit, Trash2, FolderOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { normalizeCategories, CategoryOption } from "@/lib/normalizeCategories";
import { ConfirmModal } from "@/components/dashboard/shared/ConfirmModal";

const PER_PAGE = 8;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(
        normalizeCategories(Array.isArray(data) ? data : data.categories || [])
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">
            {filtered.length} {filtered.length === 1 ? "categoría" : "categorías"}
          </p>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar categoría..."
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-48 placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Link
              href="/dashboard/categories/new"
              className="flex items-center gap-1.5 bg-[#1E3A8A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva categoría
            </Link>
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
          <span className="w-10" />
          <span>Nombre</span>
          <span className="w-20 text-right">Acciones</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                <div className="h-4 bg-gray-100 rounded w-40" />
                <div className="ml-auto h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">
              {search ? "Sin resultados" : "No hay categorías"}
            </p>
            <p className="text-sm text-gray-400 mb-5">
              {search ? `Ninguna categoría coincide con "${search}"` : "Creá la primera categoría para empezar"}
            </p>
            {!search && (
              <Link
                href="/dashboard/categories/new"
                className="flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva categoría
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0 overflow-hidden">
                  {cat.thumbnail ? (
                    <img
                      src={cat.thumbnail}
                      alt={cat.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>

                <p className="flex-1 text-sm font-semibold text-gray-800">{cat.name}</p>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/dashboard/categories/${cat._id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setConfirmDelete({ id: cat._id, name: cat.name })}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`min-w-7 h-7 text-xs font-medium rounded-lg transition-colors ${
                    page === i + 1
                      ? "bg-[#1E3A8A] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Eliminar categoría"
        description={`¿Eliminás "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
