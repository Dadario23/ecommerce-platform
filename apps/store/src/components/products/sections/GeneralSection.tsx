"use client";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function GeneralSection({ product }: { product?: { name?: string; description?: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Información general</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            Nombre del producto <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            defaultValue={product?.name}
            required
            placeholder="Ej: iPhone 15 Pro Max 256GB"
            className={INPUT}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            Descripción
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description}
            placeholder="Describe el producto, características principales, etc."
            className={`${INPUT} resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
