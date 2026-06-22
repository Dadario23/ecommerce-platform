// components/product/ImageGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({
  images,
  productName,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Validación robusta
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg border flex items-center justify-center">
        <span className="text-gray-500">Imagen no disponible</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="w-full">
      {/* Imagen principal */}
      <div className="relative w-full aspect-[4/3] bg-white rounded-lg border overflow-hidden">
        <Image
          src={currentImage}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
          priority={currentIndex === 0}
          onError={(e) => {
            console.error("Error loading image:", currentImage);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Thumbnails - solo si hay más de una imagen */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {images.map((src, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Imagen ${index + 1} de ${productName}`}
              className={clsx(
                "relative aspect-square rounded border bg-white overflow-hidden",
                currentIndex === index
                  ? "ring-2 ring-indigo-500 border-indigo-500"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <Image
                src={src}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="80px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
