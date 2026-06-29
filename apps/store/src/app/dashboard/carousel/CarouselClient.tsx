"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, CheckCircle, AlertCircle, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  initialImages: string[];
}

export default function CarouselClient({ initialImages }: Props) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showFlash = (ok: boolean, msg: string) => {
    setFlash({ ok, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "carousel");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        showFlash(false, "Error al subir una imagen");
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      const data = await res.json();
      urls.push(data.secure_url);
    }

    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carouselImages: images }),
    });
    const data = res.ok ? await res.json() : null;
    setSaving(false);
    const saved = Array.isArray(data?.carouselImages);
    showFlash(res.ok && saved, res.ok && saved ? "Cambios guardados" : "Error al guardar");
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4.5 h-4.5 text-(--tenant-primary)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Imágenes del carousel</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Subí hasta 10 imágenes · Recomendado: 1920×823 px · Formatos: JPG, PNG, WebP
            </p>
          </div>
        </div>

        {/* Upload zone */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= 10}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-500">
            {uploading ? "Subiendo..." : "Hacer clic para subir imágenes"}
          </span>
          {images.length >= 10 && (
            <span className="text-xs text-red-400">Límite de 10 imágenes alcanzado</span>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {images.length} {images.length === 1 ? "imagen" : "imágenes"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((url, i) => (
              <div key={url} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
                <Image
                  src={url}
                  alt={`Slide ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => remove(url)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No hay imágenes. Subí la primera para que aparezca en el carousel.
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3">
        {flash && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${flash.ok ? "text-emerald-600" : "text-red-500"}`}>
            {flash.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {flash.msg}
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="bg-(--tenant-primary) text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
