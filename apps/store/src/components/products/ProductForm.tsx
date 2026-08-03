"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import GeneralSection from "./sections/GeneralSection";
import MediaSection from "./sections/MediaSection";
import ReelsSection, { type ReelItem } from "./sections/ReelsSection";
import PricingSection from "./sections/PricingSection";
import StatusSection from "./sections/StatusSection";
import ProductDetailsSection from "./sections/ProductDetailsSection";
import RichDescriptionSection, { type DescriptionImageItem } from "./sections/RichDescriptionSection";

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  existing?: boolean;
}

interface ProductReel {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  duration?: number;
  order: number;
}

interface Product {
  name?: string;
  description?: string;
  descriptionImages?: string[];
  descriptionText?: string;
  price?: number;
  compareAtPrice?: number;
  images?: string[];
  isActive?: boolean;
  featured?: boolean;
  category?: { _id: string } | string;
  brand?: string;
  sku?: string;
  stock?: number;
  sizes?: { value: string; stock: number }[];
  condition?: "new" | "used";
  shippingTypes?: string[];
  reels?: ProductReel[];
}

interface ProductFormProps {
  product?: Product;
  loading: boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  actionLabel: string;
}

export default function ProductForm({ product, loading, onSubmit, actionLabel }: ProductFormProps) {
  const [images, setImages] = useState<ImageItem[]>(
    product?.images?.map((url) => ({ id: crypto.randomUUID(), preview: url, existing: true })) || []
  );

  const [descriptionImages, setDescriptionImages] = useState<DescriptionImageItem[]>(
    product?.descriptionImages?.map((url) => ({ id: crypto.randomUUID(), preview: url, existing: true })) || []
  );
  const [descriptionText, setDescriptionText] = useState(product?.descriptionText ?? "");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [reels, setReels] = useState<ReelItem[]>(
    (product?.reels ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        id: crypto.randomUUID(),
        preview: r.url,
        existing: true,
        publicId: r.publicId,
        thumbnailUrl: r.thumbnailUrl,
        duration: r.duration,
      }))
  );

  const formRef = useRef<HTMLFormElement>(null);
  // Snapshot de lo último guardado, para saber si el estado actual coincide
  // (deshacer un cambio debe volver a deshabilitar el botón). null = todavía no se guardó nada.
  const savedSnapshotRef = useRef<string | null>(null);

  // Representación comparable del formulario. Los archivos sin subir se marcan con un
  // placeholder estable (nunca va a coincidir con una URL ya guardada, y desaparece si se deshace).
  const buildComparableSnapshot = () => {
    if (!formRef.current) return null;
    const formData = new FormData(formRef.current);
    return JSON.stringify({
      name:              formData.get("name"),
      description:       formData.get("description"),
      descriptionImages: descriptionImages.map((img) => (img.existing ? img.preview : `pending:${img.id}`)),
      descriptionText:   descriptionText,
      price:             formData.get("price"),
      compareAtPrice:    formData.get("compareAtPrice"),
      category:          formData.get("category"),
      brand:             formData.get("brand"),
      sku:               formData.get("sku"),
      stock:             formData.get("stock"),
      images:            images.map((img) => (img.existing ? img.preview : `pending:${img.id}`)),
      reels:             reels.map((r) => (r.existing ? `${r.preview}|${r.publicId}` : `pending:${r.id}`)),
      isActive:          formData.get("isActive"),
      featured:          formData.get("featured"),
      condition:         formData.get("condition"),
      freeShipping:      formData.get("freeShipping"),
      shippingTypes:     formData.get("shippingTypes"),
      sizes:             formData.get("sizes"),
    });
  };

  const recomputeSaved = () => {
    if (savedSnapshotRef.current === null) return;
    setSaved(buildComparableSnapshot() === savedSnapshotRef.current);
  };

  // Los cambios en imágenes/reels/descripción enriquecida no pasan por inputs nativos
  // (se agregan con botones, o el editor de texto no es un input de formulario),
  // así que no disparan el onChange del form.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    recomputeSaved();
  }, [images, reels, descriptionImages, descriptionText]);

  const handleFormChange = () => {
    recomputeSaved();
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url as string;
  };

  const uploadReelToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/reel", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir el reel");
    return data as { secure_url: string; public_id: string; thumbnail_url?: string; duration?: number };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (images.length === 0) {
      setSubmitError("Agregá al menos una imagen del producto en la sección Imágenes.");
      return;
    }
    if (descriptionImages.some((img) => img.uploading)) {
      setSubmitError("Esperá a que terminen de procesarse las imágenes de la descripción enriquecida.");
      return;
    }
    setSubmitError(null);
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    const finalImageUrls: string[] = [];
    const finalDescriptionImageUrls: string[] = [];
    const finalReels: ProductReel[] = [];
    try {
      for (const img of images) {
        if (img.existing) {
          finalImageUrls.push(img.preview);
        } else if (img.file) {
          const url = await uploadToCloudinary(img.file);
          finalImageUrls.push(url);
        }
      }

      for (const img of descriptionImages) {
        if (img.existing) {
          finalDescriptionImageUrls.push(img.preview);
        } else if (img.file) {
          const url = await uploadToCloudinary(img.file);
          finalDescriptionImageUrls.push(url);
        }
      }

      for (const reel of reels) {
        if (reel.existing) {
          finalReels.push({
            url: reel.preview,
            publicId: reel.publicId!,
            thumbnailUrl: reel.thumbnailUrl,
            duration: reel.duration,
            order: finalReels.length,
          });
        } else if (reel.file) {
          const uploaded = await uploadReelToCloudinary(reel.file);
          finalReels.push({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            thumbnailUrl: uploaded.thumbnail_url,
            duration: uploaded.duration,
            order: finalReels.length,
          });
        }
      }
    } catch (err) {
      setSubmitError((err as Error).message || "Error al subir las imágenes o videos del producto");
      setUploading(false);
      return;
    }
    setUploading(false);

    const isActiveRaw = formData.get("isActive");

    // Se congela antes del await: si el usuario sigue editando mientras el guardado
    // está en curso, el snapshot debe reflejar lo que se mandó, no lo que hay ahora.
    const pendingSnapshot = buildComparableSnapshot();

    const ok = await onSubmit({
      name:              formData.get("name"),
      description:       formData.get("description"),
      descriptionImages: finalDescriptionImageUrls,
      descriptionText:   descriptionText,
      price:             Number(formData.get("price")),
      compareAtPrice:    formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
      category:          formData.get("category") ? String(formData.get("category")) : undefined,
      brand:             formData.get("brand"),
      sku:               formData.get("sku"),
      stock:             formData.get("stock") ? Number(formData.get("stock")) : 0,
      images:            finalImageUrls,
      reels:             finalReels,
      isActive:          isActiveRaw === "true",
      featured:          formData.get("featured") === "true",
      condition:         formData.get("condition") || "new",
      freeShipping:      formData.get("freeShipping") === "true",
      shippingTypes:     (() => {
        try { return JSON.parse(formData.get("shippingTypes") as string); } catch { return ["flex", "standard"]; }
      })(),
      // Solo viaja si el módulo de talles está activo y el producto los usa
      ...(() => {
        const raw = formData.get("sizes");
        if (typeof raw !== "string" || raw === "") return {};
        try {
          const parsed = JSON.parse(raw) as { value: string; stock: number }[];
          return { sizes: parsed.filter((s) => s.value.trim() !== "") };
        } catch {
          return {};
        }
      })(),
    });
    if (ok) {
      savedSnapshotRef.current = pendingSnapshot;
      setSaved(true);
    }
  };

  return (
    <form
      id="product-form"
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={handleFormChange}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <GeneralSection product={product} />
        <RichDescriptionSection
          product={product}
          onImagesChange={setDescriptionImages}
          onTextChange={setDescriptionText}
        />
        <MediaSection product={product} onImagesChange={setImages} />
        <ReelsSection product={product} onReelsChange={setReels} />
        <PricingSection product={product} />
      </div>

      <div className="space-y-6">
        <StatusSection product={product} />
        <ProductDetailsSection product={product} />
      </div>

      <div className="lg:col-span-3 sticky bottom-0 bg-white border-t border-gray-100 flex items-center justify-end gap-3 px-6 py-4">
        {submitError && (
          <p className="text-sm text-red-600 mr-auto">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={loading || uploading || saved}
          className="bg-(--tenant-primary) text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-(--tenant-primary-hover) transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo archivos...</>
          ) : loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Guardado</>
          ) : actionLabel}
        </button>
      </div>
    </form>
  );
}
