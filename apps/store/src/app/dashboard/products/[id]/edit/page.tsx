"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProductForm from "@/components/products/ProductForm";

export default function EditarProductoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => setProduct(data))
      .catch(() => setError("No se pudo cargar el producto"))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar el producto");
      }
      router.push("/dashboard/products");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-(--tenant-primary) font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a productos
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Editar producto</h1>
          <p className="text-sm text-gray-400 mt-1">Modificá los campos y guardá los cambios</p>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-20">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando producto...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <ProductForm
              product={product as Parameters<typeof ProductForm>[0]["product"]}
              loading={loading}
              onSubmit={handleSubmit}
              actionLabel="Guardar cambios"
            />
          </>
        )}
      </div>
    </div>
  );
}
