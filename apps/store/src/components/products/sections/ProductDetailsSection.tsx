"use client";

import { useEffect, useState } from "react";
import { normalizeCategories, CategoryOption } from "@/lib/normalizeCategories";
import { Truck, Zap, Globe, Plus, X } from "lucide-react";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

interface Product {
  category?: { _id: string } | string;
  brand?: string;
  sku?: string;
  stock?: number;
  sizes?: { value: string; stock: number }[];
  condition?: "new" | "used";
  shippingTypes?: string[];
  freeShipping?: boolean;
}

const SHIPPING_OPTIONS = [
  { value: "flex",     label: "Envío flex",     icon: Zap,   desc: "Mismo día / día siguiente" },
  { value: "standard", label: "Envío estándar", icon: Truck, desc: "2-3 días hábiles" },
  { value: "national", label: "Interior del país", icon: Globe, desc: "Correo Arg / Andreani / OCA" },
] as const;

export default function ProductDetailsSection({ product }: { product?: Product }) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [shippingTypes, setShippingTypes] = useState<string[]>(
    product?.shippingTypes ?? ["flex", "standard"],
  );

  // Stock por talle — solo si el módulo está activo para el tenant
  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizes, setSizes] = useState<{ value: string; stock: number }[]>(
    product?.sizes ?? [],
  );
  const hadSizes = (product?.sizes?.length ?? 0) > 0;
  const usesSizes = sizes.length > 0;
  const totalSizesStock = sizes.reduce((sum, s) => sum + (s.stock || 0), 0);

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((data) => setSizesEnabled(Boolean(data?.modules_sizes)))
      .catch(() => {});
  }, []);

  const toggleShipping = (value: string) => {
    setShippingTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const normalized = normalizeCategories(
          Array.isArray(data) ? data : data.categories || []
        );
        setCategories(normalized);
        if (product?.category) {
          const def =
            typeof product.category === "object"
              ? product.category._id
              : String(product.category);
          setSelectedCategory(def);
        }
      })
      .catch(() => {});
  }, [product?.category]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Detalles</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            Categoría <span className="text-red-400">*</span>
          </label>
          <select
            name="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
            className={INPUT}
          >
            <option value="" disabled>Seleccioná una categoría</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Marca</label>
          <input
            name="brand"
            defaultValue={product?.brand}
            placeholder="Ej: Samsung, Apple"
            className={INPUT}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">SKU</label>
          <input
            name="sku"
            defaultValue={product?.sku}
            placeholder="Ej: IPH15-256-BLK"
            className={INPUT}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Stock</label>
          {usesSizes ? (
            <div className={`${INPUT} bg-gray-50 text-gray-500`}>
              {totalSizesStock} (suma de talles)
            </div>
          ) : (
            <input
              type="number"
              name="stock"
              min={0}
              defaultValue={product?.stock ?? 0}
              className={INPUT}
            />
          )}
        </div>

        {/* Stock por talle (módulo sizes) */}
        {sizesEnabled && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Stock por talle
            </label>
            {(usesSizes || hadSizes) && (
              <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
            )}
            <div className="space-y-2">
              {sizes.map((size, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={size.value}
                    onChange={(e) =>
                      setSizes((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, value: e.target.value } : s)),
                      )
                    }
                    placeholder="Talle (S, M, 40…)"
                    maxLength={20}
                    className={INPUT}
                  />
                  <input
                    type="number"
                    min={0}
                    value={size.stock}
                    onChange={(e) =>
                      setSizes((prev) =>
                        prev.map((s, j) =>
                          j === i ? { ...s, stock: Math.max(0, Number(e.target.value)) } : s,
                        ),
                      )
                    }
                    className={`${INPUT} w-24 shrink-0`}
                  />
                  <button
                    type="button"
                    onClick={() => setSizes((prev) => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSizes((prev) => [...prev, { value: "", stock: 0 }])}
                disabled={sizes.length >= 20}
                className="flex items-center gap-1.5 text-sm font-medium text-(--tenant-primary) hover:underline disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Agregar talle
              </button>
              {usesSizes && (
                <p className="text-xs text-gray-400">
                  El stock general pasa a ser la suma de los talles
                </p>
              )}
            </div>
          </div>
        )}

        {/* Envío gratis */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-700">Envío gratis</p>
            <p className="text-xs text-gray-400">El costo se absorbe en el precio del producto</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="freeShipping"
              value="true"
              defaultChecked={product?.freeShipping ?? false}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-(--tenant-primary) after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {/* Tipos de envío */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipos de envío</label>
          <input type="hidden" name="shippingTypes" value={JSON.stringify(shippingTypes)} />
          <div className="space-y-2">
            {SHIPPING_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
              const checked = shippingTypes.includes(value);
              return (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    checked
                      ? "border-(--tenant-primary) bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleShipping(value)}
                    className="accent-(--tenant-primary) w-4 h-4 shrink-0"
                  />
                  <Icon className={`w-4 h-4 shrink-0 ${checked ? "text-(--tenant-primary)" : "text-gray-400"}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${checked ? "text-(--tenant-primary)" : "text-gray-700"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Condición</label>
          <div className="flex gap-2">
            {(["new", "used"] as const).map((val) => (
              <label
                key={val}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 cursor-pointer has-[:checked]:border-(--tenant-primary) has-[:checked]:bg-blue-50 transition-colors"
              >
                <input
                  type="radio"
                  name="condition"
                  value={val}
                  defaultChecked={(product?.condition ?? "new") === val}
                  className="accent-(--tenant-primary)"
                />
                <span className="text-sm font-medium text-gray-700">
                  {val === "new" ? "Nuevo" : "Usado"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
