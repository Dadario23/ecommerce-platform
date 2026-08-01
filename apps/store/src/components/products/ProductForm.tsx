"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import GeneralSection from "./sections/GeneralSection";
import MediaSection from "./sections/MediaSection";
import ReelsSection, { type ReelItem } from "./sections/ReelsSection";
import PricingSection from "./sections/PricingSection";
import StatusSection from "./sections/StatusSection";
import ProductDetailsSection from "./sections/ProductDetailsSection";
import DescriptionBlocksSection, { DescriptionBlock } from "./sections/DescriptionBlocksSection";

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

interface RawBlock {
  type: "text" | "heading" | "image";
  content?: string;
  imageUrl?: string;
  caption?: string;
}

interface Product {
  name?: string;
  description?: string;
  descriptionBlocks?: RawBlock[];
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
  onSubmit: (data: Record<string, unknown>) => void;
  actionLabel: string;
}

export default function ProductForm({ product, loading, onSubmit, actionLabel }: ProductFormProps) {
  const [images, setImages] = useState<ImageItem[]>(
    product?.images?.map((url) => ({ id: crypto.randomUUID(), preview: url, existing: true })) || []
  );

  const [descriptionBlocks, setDescriptionBlocks] = useState<DescriptionBlock[]>(
    (product?.descriptionBlocks ?? []).map((b) => ({ ...b, clientId: crypto.randomUUID() }))
  );

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
    const formData = new FormData(e.currentTarget);

    const finalImageUrls: string[] = [];
    for (const img of images) {
      if (img.existing) {
        finalImageUrls.push(img.preview);
      } else if (img.file) {
        const url = await uploadToCloudinary(img.file);
        finalImageUrls.push(url);
      }
    }

    const finalReels: ProductReel[] = [];
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

    // Strip client-only fields before saving
    const cleanBlocks = descriptionBlocks
      .filter((b) => b.type !== "image" || !!b.imageUrl)
      .map(({ clientId: _cid, uploading: _up, ...rest }) => rest);

    const isActiveRaw = formData.get("isActive");

    onSubmit({
      name:              formData.get("name"),
      description:       formData.get("description"),
      descriptionBlocks: cleanBlocks,
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
  };

  return (
    <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <GeneralSection product={product} />
        <DescriptionBlocksSection
          blocks={descriptionBlocks}
          onChange={setDescriptionBlocks}
        />
        <MediaSection product={product} onImagesChange={setImages} />
        <ReelsSection product={product} onReelsChange={setReels} />
        <PricingSection product={product} />
      </div>

      <div className="space-y-6">
        <StatusSection product={product} />
        <ProductDetailsSection product={product} />
      </div>

      <div className="lg:col-span-3 sticky bottom-0 bg-white border-t border-gray-100 flex justify-end gap-3 px-6 py-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-(--tenant-primary) text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-(--tenant-primary-hover) transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : actionLabel}
        </button>
      </div>
    </form>
  );
}
