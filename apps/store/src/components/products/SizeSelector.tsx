"use client";

import { cn } from "@/lib/utils";

type Size = { value: string; stock: number };

export default function SizeSelector({
  sizes,
  selected,
  onSelect,
}: {
  sizes: Size[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">
        Talle{selected ? `: ${selected}` : ""}
      </span>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const out = size.stock <= 0;
          return (
            <button
              key={size.value}
              type="button"
              disabled={out}
              onClick={() => onSelect(size.value)}
              aria-pressed={selected === size.value}
              className={cn(
                "min-w-11 px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all",
                out
                  ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                  : selected === size.value
                  ? "border-(--tenant-primary) bg-(--tenant-primary) text-white"
                  : "border-gray-300 text-gray-700 hover:border-(--tenant-primary)"
              )}
            >
              {size.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
