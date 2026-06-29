"use client";

import { useState } from "react";

interface StatusSectionProps {
  product?: { isActive?: boolean; featured?: boolean };
}

export default function StatusSection({ product }: StatusSectionProps) {
  const [active, setActive] = useState(product?.isActive ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-700">Estado</h2>

      {/* Publicado */}
      <div>
        <input type="hidden" name="isActive" value={active ? "true" : "false"} />
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            active ? "bg-(--tenant-primary)" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
              active ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <p className="mt-2 text-xs text-gray-500">
          {active ? (
            <span className="text-emerald-600 font-medium">Publicado — visible en la tienda</span>
          ) : (
            <span className="text-gray-400">Borrador — no visible en la tienda</span>
          )}
        </p>
      </div>

      {/* Destacado en home */}
      <div className="border-t border-gray-100 pt-4">
        <input type="hidden" name="featured" value={featured ? "true" : "false"} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Destacado en inicio</span>
          <button
            type="button"
            onClick={() => setFeatured((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              featured ? "bg-amber-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                featured ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          {featured
            ? "Aparece en la sección de productos destacados"
            : "No aparece en la sección de destacados"}
        </p>
      </div>
    </div>
  );
}
