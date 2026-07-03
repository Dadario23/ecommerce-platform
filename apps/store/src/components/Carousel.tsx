"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const FALLBACK_IMAGES = ["/carousel-placeholder.png"];

export default function Carousel({
  images = FALLBACK_IMAGES,
}: {
  images?: string[];
}) {
  return (
    <div className="w-full aspect-4/3 sm:aspect-video lg:aspect-21/9 rounded-xl overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        loop={images.length > 1}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={images.length > 1}
        className="w-full h-full"
        style={
          {
            "--swiper-navigation-size": "20px",
            "--swiper-navigation-color": "#fff",
            "--swiper-pagination-color": "#fff",
          } as React.CSSProperties
        }
      >
        {images.map((src, i) => (
          <SwiperSlide key={i} className="relative w-full h-full">
            <Image
              src={src}
              alt={`Banner ${i + 1}`}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
              priority={i === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
