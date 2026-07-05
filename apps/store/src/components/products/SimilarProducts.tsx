"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

export interface SimilarProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  avgRating?: number;
  reviewCount?: number;
}

function ProductCard({ p }: { p: SimilarProduct }) {
  const priceDiff   = p.compareAtPrice ? p.compareAtPrice - p.price : 0;
  const hasDiscount = priceDiff >= 500;
  const discountPct = hasDiscount ? Math.round((priceDiff / p.compareAtPrice!) * 100) : 0;
  const avg         = p.avgRating ?? 0;
  const reviews     = p.reviewCount ?? 0;

  return (
    <Link
      href={`/products/${p.slug}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-(--tenant-primary)/30 hover:shadow-md transition-all"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {p.images?.[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
            📦
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discountPct}% OFF
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {p.name}
        </p>

        {reviews > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>
          </div>
        )}

        <div className="mt-auto pt-1">
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
              ${p.compareAtPrice!.toLocaleString("es-AR")}
            </p>
          )}
          <p className="text-base font-bold text-gray-900">
            ${p.price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function SimilarProducts({ products }: { products: SimilarProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Productos similares</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} p={p} />
        ))}
      </div>
    </section>
  );
}
