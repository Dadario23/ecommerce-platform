import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { INSTALLMENTS } from "@/config/installments";
import { cloudinaryBlurDataUrl } from "@/lib/image-blur";

interface HomeProductCardProps {
  id: string;
  slug: string;
  image: string;
  hoverImage?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  brand?: string;
}

export default function HomeProductCard({
  id,
  slug,
  image,
  hoverImage,
  name,
  price,
  compareAtPrice,
  brand,
}: HomeProductCardProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const installment = Math.ceil(price / INSTALLMENTS.max);
  const blurUrl = cloudinaryBlurDataUrl(image || "");
  const hoverBlurUrl = hoverImage ? cloudinaryBlurDataUrl(hoverImage) : undefined;

  return (
    <Link
      href={`/products/${slug}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-(--tenant-primary)/30 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:hover:shadow-none"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden minimal:aspect-3/4 minimal:bg-gray-100">
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded minimal:bg-(--tenant-accent) minimal:rounded-none">
            -{discountPct}%
          </span>
        )}
        <FavoriteButton productId={id} className="absolute bottom-2 right-2 z-10 shadow-sm" />
        <Image
          src={image || "/placeholder-category.jpg"}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300 minimal:object-cover minimal:p-0"
          placeholder={blurUrl ? "blur" : "empty"}
          blurDataURL={blurUrl}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="hidden minimal:block object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            placeholder={hoverBlurUrl ? "blur" : "empty"}
            blurDataURL={hoverBlurUrl}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1 minimal:px-0 minimal:pt-2.5 minimal:pb-0">
        {brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-(--tenant-primary) minimal:text-gray-500">
            {brand}
          </p>
        )}
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug flex-1 minimal:text-sm">
          {name}
        </h3>

        <div className="mt-1">
          {hasDiscount && (
            <p className="text-[10px] text-gray-400 line-through">
              ${compareAtPrice.toLocaleString("es-AR")}
            </p>
          )}
          <p className="text-base font-bold text-gray-900">
            ${price.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] text-(--tenant-primary) font-medium">
            {INSTALLMENTS.max}x ${installment.toLocaleString("es-AR")}
            {INSTALLMENTS.sinInteres && " sin interés"}
          </p>
        </div>
      </div>
    </Link>
  );
}
