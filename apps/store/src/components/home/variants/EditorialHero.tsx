"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

export default function EditorialHero({
  images,
  storeName,
}: {
  images: string[];
  storeName: string;
}) {
  const slides = images.length ? images : ["/carousel-placeholder.png"];

  return (
    <section className="relative w-full h-[60vh] min-h-105 overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={slides.length > 1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="absolute inset-0 w-full h-full"
        style={{ "--swiper-pagination-color": "#fff" } as React.CSSProperties}
      >
        {slides.map((src, i) => (
          <SwiperSlide key={i} className="relative w-full h-full">
            <Image
              src={src}
              alt={storeName}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-[center_25%]"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute inset-0 z-10 bg-black/30 pointer-events-none" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <h1 className="font-brand text-5xl md:text-7xl text-white uppercase tracking-wide">
          {storeName}
        </h1>
        <p className="mt-3 text-white/80 text-sm md:text-base uppercase tracking-[0.25em]">
          Nueva colección
        </p>
        <a
          href="#destacados"
          className="pointer-events-auto mt-7 inline-block bg-white text-gray-900 text-xs font-bold uppercase tracking-widest px-10 py-3.5 hover:bg-gray-200 transition-colors"
        >
          Ver colección
        </a>
      </div>
    </section>
  );
}
