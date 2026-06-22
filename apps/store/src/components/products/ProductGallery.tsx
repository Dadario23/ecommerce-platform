"use client";

import ImageGallery from "@/components/ImageGallery";
import { IProduct } from "@/models/Product";

function processImages(product: IProduct): string[] {
  if (!product.images || !Array.isArray(product.images)) {
    return [];
  }

  return product.images
    .filter((img) => typeof img === "string" && img.trim().startsWith("http"))
    .map((img) => img.trim());
}

export default function ProductGallery({ product }: { product: IProduct }) {
  const processedImages = processImages(product);

  return (
    <div className="w-full">
      <ImageGallery images={processedImages} productName={product.name} />
    </div>
  );
}
