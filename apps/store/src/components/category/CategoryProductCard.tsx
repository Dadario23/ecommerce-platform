import Image from "next/image";
import Link from "next/link";
import ShippingBadge from "@/components/products/ShippingBadge";
import { ShippingZoneResult } from "@/hooks/useShippingZone";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { INSTALLMENTS } from "@/config/installments";

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
  product: Product;
  listView?: boolean;
  shippingZone?: ShippingZoneResult;
  shippingEnabled?: boolean;
}

export default function CategoryProductCard({ product, listView = false, shippingZone, shippingEnabled = true }: Props) {
  const image       = product.images?.[0] ?? "";
  const priceDiff   = product.compareAtPrice ? product.compareAtPrice - product.price : 0;
  const hasDiscount = !!(product.compareAtPrice && product.compareAtPrice > product.price && priceDiff >= 500);
  const discountPct = hasDiscount ? Math.round((priceDiff / product.compareAtPrice!) * 100) : 0;
  const installment = Math.ceil(product.price / INSTALLMENTS.max);
  const outOfStock  = (product.stock ?? 0) === 0;
  const isUsed      = product.condition === "used";
  const shippingTypes = product.shippingTypes ?? ["flex", "standard"];

  /* ── VISTA LISTA (siempre en categoría/búsqueda) ── */
  if (listView) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="group bg-white rounded-xl border border-gray-100 hover:border-(--tenant-primary)/30 hover:shadow-md transition-all duration-200 flex items-stretch gap-4 p-3 overflow-hidden"
      >
        {/* Imagen */}
        <div className="relative w-36 sm:w-44 aspect-square shrink-0 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
          {hasDiscount && (
            <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
              -{discountPct}%
            </span>
          )}
          {isUsed && (
            <span className="absolute top-1.5 right-1.5 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
              Usado
            </span>
          )}
          <FavoriteButton productId={product._id} className="absolute bottom-1.5 right-1.5 z-10 shadow-sm" />
          <Image
            src={image || "/placeholder-category.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 144px, 176px"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-1">
          <div>
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-wide text-(--tenant-primary) mb-0.5">
                {product.brand}
              </p>
            )}
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </div>

          <div className="space-y-0.5">
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through leading-none">
                ${product.compareAtPrice!.toLocaleString("es-AR")}
              </p>
            )}
            <p className="text-xl font-bold text-gray-900 leading-tight">
              ${product.price.toLocaleString("es-AR")}
            </p>
            {!outOfStock && (
              <p className="text-xs text-(--tenant-primary) font-medium">
                {INSTALLMENTS.max}x ${installment.toLocaleString("es-AR")}
                {INSTALLMENTS.sinInteres && " sin interés"}
              </p>
            )}
            {outOfStock && (
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit inline-block">
                Sin stock
              </span>
            )}
          </div>

          {/* Shipping badge */}
          {!outOfStock && shippingEnabled && shippingZone && (
            <ShippingBadge
              freeShipping={product.freeShipping ?? false}
              shippingTypes={shippingTypes}
              zone={shippingZone.zone}
              source={shippingZone.source}
              loading={shippingZone.loading}
              size="sm"
              inCard
            />
          )}
        </div>
      </Link>
    );
  }

  /* ── VISTA CUADRÍCULA (home / similares) ── */
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-(--tenant-primary)/30 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:hover:shadow-none"
    >
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden minimal:aspect-3/4 minimal:bg-gray-100">
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded minimal:bg-(--tenant-accent) minimal:rounded-none">
            -{discountPct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 z-10 bg-gray-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            Sin stock
          </span>
        )}
        {isUsed && !outOfStock && (
          <span className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            Usado
          </span>
        )}
        <FavoriteButton productId={product._id} className="absolute bottom-2 right-2 z-10 shadow-sm" />
        <Image
          src={image || "/placeholder-category.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300 minimal:object-cover minimal:p-0"
        />
        {product.images?.[1] && (
          <Image
            src={product.images[1]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="hidden minimal:block object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1 minimal:px-0 minimal:pt-2.5 minimal:pb-0">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-(--tenant-primary) minimal:text-gray-500">
            {product.brand}
          </p>
        )}
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug flex-1 minimal:text-sm">
          {product.name}
        </h3>

        <div className="mt-1">
          {hasDiscount && (
            <p className="text-[10px] text-gray-400 line-through">
              ${product.compareAtPrice!.toLocaleString("es-AR")}
            </p>
          )}
          <p className="text-base font-bold text-gray-900">
            ${product.price.toLocaleString("es-AR")}
          </p>
          {!outOfStock && (
            <p className="text-[10px] text-(--tenant-primary) font-medium">
              12x ${installment.toLocaleString("es-AR")}
            </p>
          )}
          {!outOfStock && shippingEnabled && (shippingTypes.includes("flex") || product.freeShipping) && (
            <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit ${
              product.freeShipping ? "bg-green-50 text-green-700" : "bg-green-50 text-green-700"
            }`}>
              {product.freeShipping ? "⚡ Envío gratis" : "⚡ Envío flex"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
