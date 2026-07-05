import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import type { HomeCategory } from "./types";

export default function EditorialCategories({
  categories,
}: {
  categories: HomeCategory[];
}) {
  if (categories.length === 0) return null;

  const featured = categories.slice(0, 3);

  return (
    <section className="mt-14">
      <h2 className="font-brand text-2xl md:text-3xl text-gray-900 text-center mb-8">
        Categorías
      </h2>
      <div className={`grid gap-4 md:gap-6 ${featured.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {featured.map((cat) => {
          const image = cat.bannerImage || cat.thumbnail || "";
          return (
            <Link
              key={cat._id}
              href={`/category/${cat.slug || slugify(cat.name)}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-gray-100"
            >
              {image && (
                <Image
                  src={image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-0 right-0 text-center font-brand text-xl md:text-2xl text-white tracking-tight">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
