"use client";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function PricingSection({ product }: { product?: { price?: number; compareAtPrice?: number } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Precios</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            Precio <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              defaultValue={product?.price}
              required
              placeholder="0.00"
              className={`${INPUT} pl-7`}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            Precio de lista
            <span className="ml-1.5 text-[10px] font-normal text-gray-400">(precio tachado para mostrar descuento)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="compareAtPrice"
              defaultValue={product?.compareAtPrice}
              placeholder="0.00"
              className={`${INPUT} pl-7`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
