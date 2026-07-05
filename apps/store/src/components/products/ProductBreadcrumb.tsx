"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { IProduct } from "@/models/Product";
import { slugify } from "@/lib/slugify";

function getCategoryInfo(product: IProduct): { name: string; slug: string } | null {
  const cat = product.category;
  if (!cat) return null;
  if (typeof cat === "object" && "name" in cat) {
    const name = (cat as { name: string; slug?: string }).name;
    const slug = (cat as { slug?: string }).slug ?? slugify(name);
    return { name, slug };
  }
  // ObjectId string — no name available yet
  return null;
}

export default function ProductBreadcrumb({ product }: { product: IProduct }) {
  const category = getCategoryInfo(product);

  return (
    <>
      {/* Mobile: single back link */}
      <nav className="flex md:hidden items-center mb-4">
        <Link
          href={category ? `/category/${category.slug}` : "/"}
          className="flex items-center gap-1 text-sm text-(--tenant-primary) hover:text-(--tenant-primary-hover) font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {category ? category.name : "Inicio"}
        </Link>
      </nav>

      {/* Desktop: full breadcrumb */}
      <nav className="hidden md:flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <Link href="/" className="flex items-center gap-1 hover:text-(--tenant-primary) transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>

        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <Link
              href={`/category/${category.slug}`}
              className="hover:text-(--tenant-primary) transition-colors capitalize"
            >
              {category.name}
            </Link>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        <span className="text-gray-800 font-medium truncate max-w-[300px] xl:max-w-[500px]">
          {product.name}
        </span>
      </nav>
    </>
  );
}
