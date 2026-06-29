"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, X, Loader2, AlertCircle } from "lucide-react";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

interface Category {
  name: string;
  description?: string;
  status: "published" | "draft";
  thumbnail?: string;
  bannerImage?: string;
}

function ImageUploader({
  label,
  hint,
  currentUrl,
  newPreview,
  onFile,
  onRemove,
  aspect,
}: {
  label: string;
  hint: string;
  currentUrl?: string;
  newPreview: string | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  aspect: string;
}) {
  const display = newPreview ?? currentUrl ?? null;

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      {display ? (
        <div className="relative">
          <img
            src={display}
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
          <label className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-(--tenant-primary) cursor-pointer transition-colors">
            <ImagePlus className="w-3.5 h-3.5" />
            Cambiar imagen
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
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

export default function EditarCategoriaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/categories/${id}`)
      .then((r) => r.json())
      .then((data) => setCategory(data))
      .catch(() => setError("No se pudo cargar la categoría"))
      .finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [thumbnailPreview, bannerPreview]);

  const handleThumbnailFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setNewThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setNewBanner(file);
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
    if (!category) return;
    setError(null);
    if (!category.name.trim()) return setError("El nombre es obligatorio");
    if (category.name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres");

    setLoading(true);
    try {
      const [thumbnailUrl, bannerImageUrl] = await Promise.all([
        newThumbnail ? uploadFile(newThumbnail) : Promise.resolve(category.thumbnail),
        newBanner ? uploadFile(newBanner) : Promise.resolve(category.bannerImage),
      ]);

      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name.trim(),
          description: category.description?.trim(),
          status: category.status,
          thumbnail: thumbnailUrl,
          bannerImage: bannerImageUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || "Error al actualizar la categoría");
      }

      router.push("/dashboard/categories");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando categoría...</span>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 md:p-8">
        <p className="text-sm text-red-500">{error || "Categoría no encontrada"}</p>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900">Editar categoría</h1>
          <p className="text-sm text-gray-400 mt-1">Modificá los campos y guardá los cambios</p>
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700">Imágenes</h2>

              <ImageUploader
                label="Miniatura"
                hint="Grilla de categorías · 1:1 · mín. 400×400px"
                currentUrl={category.thumbnail}
                newPreview={thumbnailPreview}
                onFile={handleThumbnailFile}
                onRemove={() => {
                  if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
                  setNewThumbnail(null);
                  setThumbnailPreview(null);
                  setCategory({ ...category, thumbnail: undefined });
                }}
                aspect="aspect-square"
              />

              <ImageUploader
                label="Banner homepage"
                hint="Sección de productos destacados · 3:1 · mín. 1200×400px"
                currentUrl={category.bannerImage}
                newPreview={bannerPreview}
                onFile={handleBannerFile}
                onRemove={() => {
                  if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                  setNewBanner(null);
                  setBannerPreview(null);
                  setCategory({ ...category, bannerImage: undefined });
                }}
                aspect="aspect-[3/1]"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Estado</h2>
              <select
                value={category.status}
                onChange={(e) => setCategory({ ...category, status: e.target.value as "published" | "draft" })}
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
                    value={category.name}
                    onChange={(e) => setCategory({ ...category, name: e.target.value })}
                    required
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Descripción</label>
                  <textarea
                    value={category.description ?? ""}
                    onChange={(e) => setCategory({ ...category, description: e.target.value })}
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
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
