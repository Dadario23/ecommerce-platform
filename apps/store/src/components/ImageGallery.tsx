"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cloudinaryBlurDataUrl } from "@/lib/image-blur";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Sin imagen disponible</p>
      </div>
    );
  }

  const prev = () => setSelected((i) => (i - 1 + images.length) % images.length);
  const next = () => setSelected((i) => (i + 1) % images.length);
  const currentBlurUrl = cloudinaryBlurDataUrl(images[selected]);

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-zoom-in group"
          onClick={() => setLightbox(true)}
        >
          <Image
            key={images[selected]}
            src={images[selected]}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            priority
            placeholder={currentBlurUrl ? "blur" : "empty"}
            blurDataURL={currentBlurUrl}
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {selected + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  "relative w-20 h-20 shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-all",
                  i === selected
                    ? "border-blue-600 shadow-md"
                    : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  placeholder={cloudinaryBlurDataUrl(img) ? "blur" : "empty"}
                  blurDataURL={cloudinaryBlurDataUrl(img)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(false)}
          >
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          <div
            className="relative w-[90vw] h-[85vh] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={productName}
              fill
              sizes="90vw"
              className="object-contain"
              placeholder={currentBlurUrl ? "blur" : "empty"}
              blurDataURL={currentBlurUrl}
            />
          </div>
        </div>
      )}
    </>
  );
}
