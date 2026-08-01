"use client";

import { useEffect, useRef } from "react";

interface ReelTileProps {
  url: string;
  thumbnailUrl?: string;
  onClick?: () => void;
}

export default function ReelTile({ url, thumbnailUrl, onClick }: ReelTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Solo reproduce mientras el tile está visible — evita bancar N videos a la vez en un carrusel
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`w-full aspect-[9/16] overflow-hidden rounded-[28px] bg-gray-100 ${onClick ? "cursor-pointer" : ""}`}
    >
      <video
        ref={videoRef}
        src={url}
        poster={thumbnailUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
}
