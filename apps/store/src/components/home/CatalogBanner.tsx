// components/CatalogBanner.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function CatalogBanner() {
  return (
    <section className="w-full flex justify-center py-6">
      <Link
        href="https://www.perozzi.com.ar/content/catalogo-de-ofertas.html"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[1350px]"
      >
        <Image
          src="https://www.perozzi.com.ar/img/cms/banner-revista-catalogo-desktop.jpg"
          alt="Catálogo de Ofertas"
          width={1350}
          height={229}
          className="w-full h-auto rounded-xl shadow-md"
        />
      </Link>
    </section>
  );
}
