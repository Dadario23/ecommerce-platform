import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { Product, SortConfig } from "@/types/product";

function getCategoryName(category: unknown): string {
  if (!category) return "—";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category)
    return (category as { name: string }).name;
  return "—";
}

interface ProductsTableViewProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (ids: string[]) => void;
  onQuickEdit: (productId: string, field: keyof Product, value: unknown) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

export function ProductsTableView({
  products,
  selectedProducts,
  onSelectProduct,
  onQuickEdit,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
}: ProductsTableViewProps) {
  function handleSort(key: keyof Product) {
    onSort({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  }

  function SortIcon({ column }: { column: keyof Product }) {
    if (sortConfig.key !== column)
      return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 shrink-0" />;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="w-3 h-3 text-(--tenant-primary) ml-1 shrink-0" />
      : <ArrowDown className="w-3 h-3 text-(--tenant-primary) ml-1 shrink-0" />;
  }

  const allSelected = products.length > 0 && selectedProducts.length === products.length;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-semibold text-gray-500">No se encontraron productos</p>
        <p className="text-xs text-gray-400 mt-1">Probá con otros filtros</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="w-10 px-5 py-3 text-left">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) =>
                  onSelectProduct(checked ? products.map((p) => p._id) : [])
                }
              />
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Producto
            </th>
            <th
              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none"
              onClick={() => handleSort("category" as keyof Product)}
            >
              <span className="inline-flex items-center">
                Categoría <SortIcon column={"category" as keyof Product} />
              </span>
            </th>
            <th
              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none whitespace-nowrap"
              onClick={() => handleSort("stock")}
            >
              <span className="inline-flex items-center">
                Stock <SortIcon column="stock" />
              </span>
            </th>
            <th
              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none whitespace-nowrap"
              onClick={() => handleSort("price")}
            >
              <span className="inline-flex items-center">
                Precio <SortIcon column="price" />
              </span>
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const imageSrc = product.images?.[0];
            const stockQty = product.stock ?? 0;
            const stockColor =
              stockQty > 5
                ? "text-green-700 bg-green-50"
                : stockQty > 0
                ? "text-yellow-700 bg-yellow-50"
                : "text-red-600 bg-red-50";
            const categoryName = getCategoryName(product.category);

            return (
              <tr
                key={product._id}
                className="hover:bg-gray-50/70 transition-colors"
              >
                {/* Checkbox */}
                <td className="px-5 py-3.5">
                  <Checkbox
                    checked={selectedProducts.includes(product._id)}
                    onCheckedChange={(checked) =>
                      onSelectProduct(
                        checked
                          ? [...selectedProducts, product._id]
                          : selectedProducts.filter((id) => id !== product._id)
                      )
                    }
                  />
                </td>

                {/* Producto */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0 overflow-hidden">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-300 font-medium">
                          SIN<br />IMG
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold text-gray-800 truncate max-w-52"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-[11px] text-gray-400 font-mono">
                          {product.sku}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Categoría */}
                <td className="px-4 py-3.5">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {categoryName}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stockColor}`}>
                    {stockQty}
                  </span>
                </td>

                {/* Precio */}
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-gray-900 text-sm">
                    ${product.price.toLocaleString("es-AR")}
                  </p>
                  {product.compareAtPrice && (
                    <p className="line-through text-[11px] text-gray-400">
                      ${product.compareAtPrice.toLocaleString("es-AR")}
                    </p>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onQuickEdit(product._id, "isActive", !product.isActive)}
                    title={product.isActive ? "Despublicar" : "Publicar"}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      product.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {product.isActive
                      ? <Eye className="w-3 h-3" />
                      : <EyeOff className="w-3 h-3" />
                    }
                    {product.isActive ? "Publicado" : "Inactivo"}
                  </button>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
