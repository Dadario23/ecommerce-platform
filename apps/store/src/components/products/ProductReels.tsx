"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { Maximize2 } from "lucide-react";
import ReelLightbox from "@/components/reels/ReelLightbox";
import type { IReel } from "@/models/Product";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

function ReelSlide({ reel, active, onExpand }: { reel: IReel; active: boolean; onExpand: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] bg-gray-100">
      <video
        ref={videoRef}
        src={reel.url}
        poster={reel.thumbnailUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          videoRef.current?.pause();
          onExpand();
        }}
        className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ProductReels({ reels }: { reels: IReel[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sorted = [...reels].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <div>
      <Swiper
        modules={[Navigation, Pagination]}
        slidesPerView="auto"
        centeredSlides
        spaceBetween={12}
        pagination={sorted.length > 1 ? { clickable: true } : false}
        navigation={sorted.length > 1}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        className="!pb-8"
        style={
          {
            "--swiper-navigation-size": "16px",
            "--swiper-navigation-color": "#374151",
            "--swiper-pagination-color": "#374151",
          } as React.CSSProperties
        }
      >
        {sorted.map((reel, i) => (
          <SwiperSlide key={i} className="!w-[58%]">
            <ReelSlide reel={reel} active={i === activeIndex} onExpand={() => setLightboxIndex(i)} />
          </SwiperSlide>
        ))}
      </Swiper>

      {lightboxIndex !== null && (
        <ReelLightbox items={sorted} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
