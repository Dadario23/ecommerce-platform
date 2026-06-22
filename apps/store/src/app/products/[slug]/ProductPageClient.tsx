"use client";

import { AlertTriangle } from "lucide-react";
import { IProduct } from "@/models/Product";
import ProductBreadcrumb from "@/components/products/ProductBreadcrumb";
import ProductGallery from "@/components/products/ProductGallery";
import ProductInfo from "@/components/products/ProductInfo";
import ProductBuyActions from "@/components/products/ProductBuyActions";
import ProductShippingCalculator from "@/components/products/ProductShippingCalculator";
import ProductTabs from "@/components/products/ProductTabs";
import SimilarProducts from "@/components/products/SimilarProducts";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { SimilarProduct } from "@/components/products/SimilarProducts";
import type { SerializedReview } from "@/components/products/ReviewsSection";

interface ProductPageClientProps {
  product: IProduct;
  similarProducts: SimilarProduct[];
  initialReviews: SerializedReview[];
  shippingEnabled?: boolean;
}

export default function ProductPageClient({
  product,
  similarProducts,
  initialReviews,
  shippingEnabled = true,
}: ProductPageClientProps) {
  const homeDelivery = product.homeDelivery ?? true;

  return (
    // pt-28 mobile (64px navbar + 32px promobar + 16px buffer)
    // md:pt-44 desktop (106px navbar + 32px promobar + 38px buffer)
    <div className="pt-28 md:pt-44 pb-20 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <ProductBreadcrumb product={product} />

        {/* Main layout */}
        <div className="mt-6 flex flex-col lg:flex-row gap-10 xl:gap-14">

          {/* Left — gallery */}
          <div className="flex-1 min-w-0">
            <ProductGallery product={product} />
          </div>

          {/* Right — info panel */}
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
            <div className="lg:sticky lg:top-44 space-y-5">
              <ProductInfo product={product} />

              {/* Favorito */}
              <FavoriteButton
                productId={String(product._id)}
                variant="full"
              />

              {/* Advertencia: solo retiro en sucursal */}
              {!homeDelivery && (
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      Solo retiro en sucursal
                    </p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      Este producto no tiene envío a domicilio disponible. Podés retirarlo en nuestro local.
                    </p>
                  </div>
                </div>
              )}

              <ProductBuyActions product={product} />
              <ProductShippingCalculator
                shippingTypes={product.shippingTypes ?? ["flex", "standard"]}
                freeShipping={product.freeShipping ?? false}
                shippingEnabled={shippingEnabled}
              />
            </div>
          </div>
        </div>

        {/* Tabs: description + reviews */}
        <div className="mt-14">
          <ProductTabs product={product} initialReviews={initialReviews} />
        </div>

        {/* Productos similares */}
        {similarProducts.length > 0 && (
          <SimilarProducts products={similarProducts} />
        )}

      </div>
    </div>
  );
}
