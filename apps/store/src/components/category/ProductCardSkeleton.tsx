import { Card } from "@/components/ui/card";

export default function ProductCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse space-y-3">
      {/* Imagen */}
      <div className="w-full h-48 bg-gray-200 rounded-lg"></div>

      {/* Nombre del producto */}
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>

      {/* Precio */}
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>

      {/* Botón */}
      <div className="h-8 bg-gray-200 rounded mt-2"></div>
    </Card>
  );
}
