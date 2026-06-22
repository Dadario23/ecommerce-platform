"use client";

import { Heart } from "lucide-react";
import CategoryProductCard from "@/components/category/CategoryProductCard";

interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  stock?: number;
  condition?: "new" | "used";
  shippingTypes?: string[];
  freeShipping?: boolean;
}

interface Props {
  products: Product[];
}

export default function FavoritesClient({ products }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
        <h2 className="text-lg font-bold text-gray-900">Mis favoritos</h2>
        {products.length > 0 && (
          <span className="text-sm text-gray-400 font-normal">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-red-200" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Todavía no tenés favoritos</p>
          <p className="text-sm text-gray-400">
            Tocá el corazón en cualquier producto para guardarlo acá
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((product) => (
            <CategoryProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
