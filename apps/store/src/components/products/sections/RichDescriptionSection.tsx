"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, X, GripVertical, Loader2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 5;

export interface DescriptionImageItem {
  id: string;
  file?: File;
  preview: string;
  existing?: boolean;
  uploading?: boolean;
}

interface Props {
  product?: { descriptionImages?: string[]; descriptionText?: string };
  onImagesChange: (images: DescriptionImageItem[]) => void;
  onTextChange: (html: string) => void;
}

export default function RichDescriptionSection({ product, onImagesChange, onTextChange }: Props) {
  const [images, setImages] = useState<DescriptionImageItem[]>(
    product?.descriptionImages?.map((url) => ({
      id: crypto.randomUUID(),
      preview: url,
      existing: true,
    })) || []
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(product?.descriptionText ?? "");

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

  const handleTextChange = (html: string) => {
    setText(html);
    onTextChange(html);
  };

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const files = Array.from(fileList);

    if (images.length + files.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} imágenes permitidas`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Solo se permiten JPG, PNG y WebP");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Cada imagen debe pesar menos de 5 MB");
        return;
      }
    }

    // Placeholders con spinner: la compresión tarda unos segundos y sin esto
    // parece que la imagen no se subió.
    const placeholderIds = files.map(() => crypto.randomUUID());
    const rawPreviews = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [
      ...prev,
      ...files.map((_file, i) => ({
        id: placeholderIds[i],
        preview: rawPreviews[i],
        uploading: true,
      })),
    ]);

    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await imageCompression(files[i], {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        const finalPreview = URL.createObjectURL(compressed);
        setImages((prev) =>
          prev.map((img) =>
            img.id === placeholderIds[i]
              ? { ...img, file: compressed, preview: finalPreview, uploading: false }
              : img
          )
        );
        URL.revokeObjectURL(rawPreviews[i]);
      }
    } catch (err) {
      setError((err as Error).message || "Error al procesar la imagen");
      setImages((prev) => prev.filter((img) => !placeholderIds.includes(img.id)));
      rawPreviews.forEach((url) => URL.revokeObjectURL(url));
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
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-700">
          Descripción enriquecida
          <span className="ml-1.5 text-[10px] font-normal text-gray-400">
            ({images.length}/{MAX_FILES} imágenes)
          </span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Se muestra en la página del producto además de la descripción simple.
        </p>
      </div>

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
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
                className={`w-full h-full object-contain p-1.5 ${img.uploading ? "opacity-40" : ""}`}
              />
              {img.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                </div>
              )}
              <span className="absolute bottom-1 left-1 text-[10px] bg-gray-900/70 text-white px-1.5 py-0.5 rounded-md">
                {i + 1}
              </span>
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

      <div className="mt-5">
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Texto</label>
        <RichTextEditor value={text} onChange={handleTextChange} />
      </div>
    </div>
  );
}
