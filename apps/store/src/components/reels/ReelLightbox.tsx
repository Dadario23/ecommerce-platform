"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ReelLightboxItem {
  url: string;
}

interface ReelLightboxProps {
  items: ReelLightboxItem[];
  startIndex: number;
  onClose: () => void;
}

export default function ReelLightbox({ items, startIndex, onClose }: ReelLightboxProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items.length, onClose]);

  const current = items[index];
  if (!current) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <X className="w-7 h-7" />
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          className="absolute left-2 sm:left-6 text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      <div className="w-full max-w-[420px] aspect-[9/16] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <video
          key={current.url}
          src={current.url}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      {index < items.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          className="absolute right-2 sm:right-6 text-white/80 hover:text-white"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>,
    document.body
  );
}
