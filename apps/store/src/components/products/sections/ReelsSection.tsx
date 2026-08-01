"use client";

import { useState, useEffect } from "react";
import { Film, X, GripVertical } from "lucide-react";
import ReelTile from "@/components/reels/ReelTile";

const MAX_SIZE = 30 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_REELS = 8;

export interface ReelItem {
  id: string;
  file?: File;
  preview: string;
  existing?: boolean;
  publicId?: string;
  thumbnailUrl?: string;
  duration?: number;
}

interface ProductReel {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  duration?: number;
  order: number;
}

interface Props {
  product?: { reels?: ProductReel[] };
  onReelsChange: (reels: ReelItem[]) => void;
}

export default function ReelsSection({ product, onReelsChange }: Props) {
  // Solo se muestra si el módulo está activo para el tenant
  const [enabled, setEnabled] = useState(false);
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((data) => setEnabled(Boolean(data?.modules_reels)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    onReelsChange(reels);
  }, [reels, onReelsChange]);

  useEffect(() => {
    return () => {
      reels.forEach((r) => {
        if (!r.existing && r.preview.startsWith("blob:")) {
          URL.revokeObjectURL(r.preview);
        }
      });
    };
  }, [reels]);

  const handleFiles = (fileList: FileList) => {
    setError(null);
    const files = Array.from(fileList);

    if (reels.length + files.length > MAX_REELS) {
      setError(`Máximo ${MAX_REELS} reels permitidos`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Solo se permiten videos MP4, WebM o MOV");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Cada video debe pesar menos de 30 MB");
        return;
      }
    }

    const newItems: ReelItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setReels((prev) => [...prev, ...newItems]);
  };

  const removeReel = (index: number) => {
    setReels((prev) => {
      const toRemove = prev[index];
      if (!toRemove.existing && toRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReorder = (from: number, to: number) => {
    if (from === to) return;
    setReels((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  if (!enabled) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Reels
        <span className="ml-1.5 text-[10px] font-normal text-gray-400">
          ({reels.length}/{MAX_REELS})
        </span>
      </h2>

      {reels.length < MAX_REELS && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
          <Film className="w-7 h-7 text-gray-300" />
          <span className="text-sm text-gray-400">Hacé clic para subir videos</span>
          <span className="text-xs text-gray-300">MP4, WebM, MOV — máx. 30 MB y 60s por video</span>
          <input
            type="file"
            multiple
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {reels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) {
                  handleReorder(dragIndex, i);
                  setDragIndex(null);
                }
              }}
              className="relative group cursor-move"
            >
              {/* pointer-events-none: el video no debe capturar el drag&drop del reorder */}
              <div className="pointer-events-none">
                <ReelTile url={reel.preview} thumbnailUrl={reel.thumbnailUrl} />
              </div>
              <button
                type="button"
                onClick={() => removeReel(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {reels.length > 1 && (
        <p className="text-xs text-gray-400 mt-2">Arrastrá los reels para cambiar el orden</p>
      )}
    </div>
  );
}
