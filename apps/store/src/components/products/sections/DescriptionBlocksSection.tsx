"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import {
  Type, Heading2, ImageIcon, Trash2,
  ChevronUp, ChevronDown, Plus, Loader2,
} from "lucide-react";

export interface DescriptionBlock {
  clientId: string;
  type: "text" | "heading" | "image";
  content?: string;
  imageUrl?: string;
  caption?: string;
  uploading?: boolean;
}

interface Props {
  blocks: DescriptionBlock[];
  onChange: Dispatch<SetStateAction<DescriptionBlock[]>>;
}

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

const BLOCK_META = {
  heading: { label: "Título",  Icon: Heading2,  color: "text-blue-500"    },
  text:    { label: "Texto",   Icon: Type,       color: "text-gray-500"    },
  image:   { label: "Imagen",  Icon: ImageIcon,  color: "text-emerald-500" },
} as const;

export default function DescriptionBlocksSection({ blocks, onChange }: Props) {
  // Functional updaters ensure async callbacks always operate on the latest state
  const update = (idx: number, patch: Partial<DescriptionBlock>) => {
    onChange((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const remove = (idx: number) =>
    onChange((prev) => prev.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    onChange((prev) => {
      const next = [...prev];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  };

  const addBlock = (type: DescriptionBlock["type"]) => {
    const clientId = crypto.randomUUID();
    onChange((prev) => [
      ...prev,
      type === "image"
        ? { clientId, type, imageUrl: "", caption: "" }
        : { clientId, type, content: "" },
    ]);
  };

  const handleImageFile = async (file: File, idx: number) => {
    update(idx, { uploading: true });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      update(idx, { imageUrl: data.secure_url as string, uploading: false });
    } catch {
      update(idx, { uploading: false });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-700">Descripción enriquecida</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Alternará bloques de texto e imágenes en la página del producto. Si no agregás bloques,
          se usará la descripción de texto simple.
        </p>
      </div>

      {/* Block list */}
      {blocks.length > 0 && (
        <div className="space-y-3 mb-4">
          {blocks.map((block, idx) => {
            const meta = BLOCK_META[block.type];
            const Icon = meta.Icon;

            return (
              <div key={block.clientId} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                  <span className="text-xs font-medium text-gray-500 flex-1">{meta.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                      <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === blocks.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button type="button" onClick={() => remove(idx)}
                      className="p-1 rounded hover:bg-red-100 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  {block.type === "heading" && (
                    <input
                      value={block.content ?? ""}
                      onChange={(e) => update(idx, { content: e.target.value })}
                      placeholder="Título de sección..."
                      className={INPUT}
                    />
                  )}

                  {block.type === "text" && (
                    <textarea
                      value={block.content ?? ""}
                      onChange={(e) => update(idx, { content: e.target.value })}
                      placeholder="Texto descriptivo..."
                      rows={3}
                      className={`${INPUT} resize-none`}
                    />
                  )}

                  {block.type === "image" && (
                    <div className="space-y-2">
                      {block.imageUrl ? (
                        <>
                          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                            <Image
                              src={block.imageUrl}
                              alt=""
                              fill
                              sizes="600px"
                              className="object-cover"
                            />
                          </div>
                          <label className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-[#1E3A8A] cursor-pointer transition-colors">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Cambiar imagen
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], idx)}
                            />
                          </label>
                        </>
                      ) : (
                        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl h-36 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors ${block.uploading ? "opacity-60 pointer-events-none" : ""}`}>
                          {block.uploading ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              <ImageIcon className="w-6 h-6 text-gray-300" />
                              <span className="text-xs text-gray-400">Hacé clic para subir imagen</span>
                              <span className="text-[10px] text-gray-300">
                                Recomendado: 1200 × 628 px · JPG/PNG · máx. 300 KB
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], idx)}
                          />
                        </label>
                      )}
                      <input
                        value={block.caption ?? ""}
                        onChange={(e) => update(idx, { caption: e.target.value })}
                        placeholder="Descripción de la imagen (opcional)..."
                        className={INPUT}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        {(["heading", "text", "image"] as const).map((type) => {
          const meta = BLOCK_META[type];
          const Icon = meta.Icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {blocks.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-4 pb-1">
          Usá los botones de arriba para agregar bloques de contenido enriquecido.
        </p>
      )}
    </div>
  );
}
