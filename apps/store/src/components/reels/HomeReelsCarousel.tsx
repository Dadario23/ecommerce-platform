"use client";

import { useState } from "react";
import Link from "next/link";
import ReelTile from "./ReelTile";
import ReelLightbox from "./ReelLightbox";
import type { HomeReelItem } from "@/components/home/variants/types";

export default function HomeReelsCarousel({ items }: { items: HomeReelItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item, i) => (
          <div key={`${item.productSlug}-${i}`} className="w-40 shrink-0">
            <ReelTile url={item.url} thumbnailUrl={item.thumbnailUrl} onClick={() => setOpenIndex(i)} />
            <Link
              href={`/products/${item.productSlug}`}
              className="block mt-1.5 text-xs font-medium text-gray-700 hover:text-(--tenant-primary) truncate transition-colors"
            >
              {item.productName}
            </Link>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <ReelLightbox items={items} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  );
}
