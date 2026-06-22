"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IProduct, IDescriptionBlock } from "@/models/Product";
import ReviewsSection from "./ReviewsSection";

function BlockRenderer({ blocks }: { blocks: IDescriptionBlock[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3 key={i} className="text-xl font-bold text-gray-900 leading-snug">
              {block.content}
            </h3>
          );
        }

        if (block.type === "text") {
          return (
            <p key={i} className="text-gray-600 leading-relaxed text-base">
              {block.content}
            </p>
          );
        }

        if (block.type === "image" && block.imageUrl) {
          return (
            <figure key={i} className="w-full">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gray-50">
                <Image
                  src={block.imageUrl}
                  alt={block.caption ?? ""}
                  width={1200}
                  height={630}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="w-full h-auto object-cover"
                  priority={i < 2}
                />
              </div>
              {block.caption && (
                <figcaption className="text-xs text-gray-400 text-center mt-2">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        return null;
      })}
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
  const hasBlocks  = (product.descriptionBlocks?.length ?? 0) > 0;

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
          {hasBlocks ? (
            <BlockRenderer blocks={product.descriptionBlocks!} />
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
