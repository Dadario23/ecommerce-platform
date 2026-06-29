"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, X, GripVertical } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 4;

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  existing?: boolean;
}

interface Props {
  product?: { images?: string[] };
  onImagesChange: (images: ImageItem[]) => void;
}

export default function MediaSection({ product, onImagesChange }: Props) {
  const [images, setImages] = useState<ImageItem[]>(
    product?.images?.map((url: string) => ({
      id: crypto.randomUUID(),
      preview: url,
      existing: true,
    })) || []
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onImagesChange(images);
  }, [images, onImagesChange]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.existing && img.preview.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  const handleFiles = async (fileList: FileList) => {
    try {
      setError(null);
      const files = Array.from(fileList);

      if (images.length + files.length > MAX_FILES) {
        throw new Error(`Máximo ${MAX_FILES} imágenes permitidas`);
      }
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Solo se permiten JPG, PNG y WebP");
        if (file.size > MAX_SIZE) throw new Error("Cada imagen debe pesar menos de 5 MB");
      }

      const newItems: ImageItem[] = [];
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        newItems.push({
          id: crypto.randomUUID(),
          file: compressed,
          preview: URL.createObjectURL(compressed),
        });
      }
      setImages((prev) => [...prev, ...newItems]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const toRemove = prev[index];
      if (!toRemove.existing && toRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReorder = (from: number, to: number) => {
    if (from === to) return;
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Imágenes
        <span className="ml-1.5 text-[10px] font-normal text-gray-400">
          ({images.length}/{MAX_FILES})
        </span>
      </h2>

      {images.length < MAX_FILES && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
          <ImagePlus className="w-7 h-7 text-gray-300" />
          <span className="text-sm text-gray-400">Hacé clic para subir imágenes</span>
          <span className="text-xs text-gray-300">JPG, PNG, WebP — máx. 5 MB por imagen</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) {
                  handleReorder(dragIndex, i);
                  setDragIndex(null);
                }
              }}
              className="relative group rounded-xl border border-gray-100 overflow-hidden bg-gray-50 aspect-square cursor-move"
            >
              <img
                src={img.preview}
                alt={`imagen ${i + 1}`}
                className="w-full h-full object-contain p-1.5"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-(--tenant-primary) text-white px-1.5 py-0.5 rounded-md">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-1 left-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-gray-400 mt-2">Arrastrá las imágenes para cambiar el orden</p>
      )}
    </div>
  );
}
