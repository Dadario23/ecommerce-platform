import { Edit, Trash2 } from "lucide-react";
import { Product } from "@/types/product";

function getCategoryName(category: unknown): string {
  if (!category) return "Sin categoría";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category)
    return (category as { name: string }).name;
  return "Sin categoría";
}

interface ProductsGridViewProps {
  products: Product[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

export function ProductsGridView({ products, onEdit, onDelete }: ProductsGridViewProps) {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const imageSrc = product.images?.[0];
        const stockQty = product.stock ?? 0;
        const stockPill =
          stockQty > 5
            ? "bg-green-100 text-green-700"
            : stockQty > 0
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-600";

        return (
          <div
            key={product._id}
            className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="relative w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                    N/A
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(product._id)}
                  className="p-1.5 text-gray-400 hover:text-(--tenant-primary) hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(product._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">
              {product.name}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {getCategoryName(product.category)}
            </p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  ${product.price.toLocaleString("es-AR")}
                </p>
                {product.compareAtPrice && (
                  <p className="line-through text-xs text-gray-400">
                    ${product.compareAtPrice.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stockPill}`}>
                  {stockQty} uds
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {product.isActive ? "Publicado" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
