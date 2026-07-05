import { Star, ShoppingBag } from "lucide-react";
import { IProduct } from "@/models/Product";
import InstallmentsInfo from "@/components/products/InstallmentsInfo";

const TRANSFER_DISCOUNT = 0.20;

export default function ProductInfo({ product }: { product: IProduct }) {
  const stock = product.stock ?? 0;
  const isInStock = stock > 0;

  const priceDiff = product.compareAtPrice ? product.compareAtPrice - product.price : 0;
  const hasDiscount = !!(product.compareAtPrice && product.compareAtPrice > product.price && priceDiff >= 500);
  const discountPct = hasDiscount
    ? Math.round((priceDiff / product.compareAtPrice!) * 100)
    : 0;
  const savings = hasDiscount ? priceDiff : 0;

  const transferPrice = Math.round(product.price * (1 - TRANSFER_DISCOUNT));
  const transferSavings = product.price - transferPrice;
  const avg = product.avgRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const unitsSold = product.unitsSold ?? 0;

  return (
    <div className="space-y-5">
      {/* Brand + condition + stock */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-widest text-(--tenant-primary)">
              {product.brand}
            </span>
          )}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              product.condition === "used"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {product.condition === "used" ? "Usado" : "Nuevo"}
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isInStock
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isInStock ? (stock > 5 ? "En stock" : `Últimas ${stock} unidades`) : "Sin stock"}
        </span>
      </div>

      {/* Name */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
        {product.name}
      </h1>

      {/* Rating + units sold */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(avg)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 fill-gray-200"
                }`}
              />
            ))}
          </div>
          {reviewCount > 0 ? (
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{avg.toFixed(1)}</span>{" "}
              ({reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"})
            </span>
          ) : (
            <span className="text-sm text-gray-400">Sin reseñas aún</span>
          )}
        </div>
        {unitsSold > 0 && (
          <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full border border-orange-200">
            <ShoppingBag className="w-3 h-3" />
            {unitsSold.toLocaleString("es-AR")}+ vendidos
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Price block */}
      <div className="space-y-1.5">
        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-400 line-through">
              ${product.compareAtPrice!.toLocaleString("es-AR")}
            </span>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              {discountPct}% OFF
            </span>
          </div>
        )}

        <div className="flex items-end gap-3">
          <span className="text-4xl font-extrabold text-gray-900">
            ${product.price.toLocaleString("es-AR")}
          </span>
          {hasDiscount && (
            <span className="text-sm text-green-600 font-medium mb-1">
              Ahorrás ${savings.toLocaleString("es-AR")}
            </span>
          )}
        </div>

        <InstallmentsInfo price={product.price} />

        {/* Transfer price */}
        <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
            Precio por transferencia bancaria · {TRANSFER_DISCOUNT * 100}% OFF
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-green-700">
              ${transferPrice.toLocaleString("es-AR")}
            </span>
            <span className="text-sm text-green-600 font-medium">
              Ahorrás ${transferSavings.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {product.sku && (
          <p className="text-xs text-gray-400 pt-1">SKU: {product.sku}</p>
        )}
      </div>
    </div>
  );
}
