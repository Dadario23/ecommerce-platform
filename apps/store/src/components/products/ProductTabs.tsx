"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IProduct } from "@/models/Product";
import { safeImageSrc } from "@/lib/safe-image-src";
import ReviewsSection from "./ReviewsSection";

function RichDescription({ images, html }: { images: string[]; html?: string }) {
  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((url, i) => (
            <div key={url + i} className="relative w-full overflow-hidden rounded-2xl bg-gray-50">
              <Image
                src={safeImageSrc(url, "/placeholder-category.jpg")}
                alt=""
                width={1200}
                height={630}
                sizes="(max-width: 768px) 100vw, 800px"
                className="w-full h-auto object-cover"
                priority={i < 2}
              />
            </div>
          ))}
        </div>
      )}
      {html && (
        <div
          className="prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

import type { SerializedReview } from "./ReviewsSection";

interface ProductTabsProps {
  product: IProduct;
  initialReviews?: SerializedReview[];
}

export default function ProductTabs({ product, initialReviews = [] }: ProductTabsProps) {
  const productId  = String(product._id);
  const avg        = product.avgRating  ?? 0;
  const count      = product.reviewCount ?? 0;
  const descriptionImages = product.descriptionImages ?? [];
  const hasRichDescription = descriptionImages.length > 0 || !!product.descriptionText;

  return (
    <div className="mt-8">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="reviews">
            Reseñas{count > 0 ? ` (${count})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          {hasRichDescription ? (
            <RichDescription images={descriptionImages} html={product.descriptionText} />
          ) : (
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="text-gray-400">No hay descripción disponible.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewsSection productId={productId} initialAvg={avg} initialCount={count} initialReviews={initialReviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
