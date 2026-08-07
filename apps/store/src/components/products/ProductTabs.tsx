"use client";

import Image from "next/image";
import { IProduct } from "@/models/Product";
import { safeImageSrc } from "@/lib/safe-image-src";

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

interface ProductTabsProps {
  product: IProduct;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const descriptionImages = product.descriptionImages ?? [];
  const hasRichDescription = descriptionImages.length > 0 || !!product.descriptionText;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Descripción</h2>
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
    </div>
  );
}
