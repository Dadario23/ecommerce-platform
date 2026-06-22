"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/products/ProductForm";

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload: Record<string, unknown>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el producto");
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
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1E3A8A] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a productos
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Nuevo producto</h1>
          <p className="text-sm text-gray-400 mt-1">Completá los campos para agregar un producto a la tienda</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <ProductForm loading={loading} onSubmit={handleSubmit} actionLabel="Crear producto" />
      </div>
    </div>
  );
}
