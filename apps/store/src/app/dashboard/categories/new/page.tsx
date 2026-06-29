"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, X, Loader2, AlertCircle } from "lucide-react";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

function ImageUploader({
  label,
  hint,
  preview,
  onFile,
  onRemove,
  aspect,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  aspect: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className={`w-full ${aspect} object-cover rounded-xl border border-gray-100 bg-gray-50`}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl ${aspect} cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors`}>
          <ImagePlus className="w-6 h-6 text-gray-300" />
          <span className="text-xs text-gray-400 text-center px-2">Hacé clic para subir</span>
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>
    </div>
  );
}

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: formData });
    if (!up.ok) throw new Error("Error al subir la imagen");
    const data = await up.json();
    return data.secure_url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("El nombre es obligatorio");
    if (name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres");

    setLoading(true);
    try {
      const [thumbnailUrl, bannerImageUrl] = await Promise.all([
        thumbnail ? uploadFile(thumbnail) : Promise.resolve(undefined),
        banner ? uploadFile(banner) : Promise.resolve(undefined),
      ]);

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          thumbnail: thumbnailUrl,
          bannerImage: bannerImageUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || "Error al crear la categoría");
      }

      router.push("/dashboard/categories");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/categories"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-(--tenant-primary) font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a categorías
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Nueva categoría</h1>
          <p className="text-sm text-gray-400 mt-1">Completá los campos para crear una categoría</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-6">
            {/* Imágenes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700">Imágenes</h2>

              <ImageUploader
                label="Miniatura"
                hint="Grilla de categorías · 1:1 · mín. 400×400px"
                preview={thumbnailPreview}
                onFile={handleThumbnailFile}
                onRemove={() => { if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); setThumbnail(null); setThumbnailPreview(null); }}
                aspect="aspect-square"
              />

              <ImageUploader
                label="Banner homepage"
                hint="Sección de productos destacados · 3:1 · mín. 1200×400px"
                preview={bannerPreview}
                onFile={handleBannerFile}
                onRemove={() => { if (bannerPreview) URL.revokeObjectURL(bannerPreview); setBanner(null); setBannerPreview(null); }}
                aspect="aspect-[3/1]"
              />
            </div>

            {/* Estado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Estado</h2>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                className={INPUT}
              >
                <option value="published">Publicada</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Información</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Celulares, Accesorios"
                    required
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción breve de la categoría"
                    rows={5}
                    className={`${INPUT} resize-none`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-(--tenant-primary) text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : "Crear categoría"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
