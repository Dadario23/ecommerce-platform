import Image from "next/image";
import Link from "next/link";
import HomeProductCard from "./HomeProductCard";

interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
}

interface CategoryBlockProps {
  bannerImage: string;
  thumbnail: string;
  bannerTitle: string;
  categorySlug: string;
  products: Product[];
}

export default function CategoryBlock({
  bannerImage,
  thumbnail,
  bannerTitle,
  categorySlug,
  products,
}: CategoryBlockProps) {
  const displayImage = bannerImage || thumbnail;
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Banner */}
      <Link
        href={`/category/${categorySlug}`}
        className="relative flex h-36 sm:h-44 overflow-hidden group"
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={bannerTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-(--tenant-primary) to-(--tenant-primary-hover)" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
          <h2 className="text-white font-bold text-lg sm:text-xl drop-shadow">
            {bannerTitle}
          </h2>
          <span className="text-white/80 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            Ver todos →
          </span>
        </div>
      </Link>

      {/* Products grid */}
      <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100 border-t border-gray-100">
        {products.slice(0, 3).map((p) => (
          <HomeProductCard
            key={p.slug}
            id={String(p._id)}
            slug={p.slug}
            image={p.images?.[0] ?? ""}
            name={p.name}
            price={p.price}
            compareAtPrice={p.compareAtPrice}
            brand={p.brand}
          />
        ))}
      </div>
    </div>
  );
}
