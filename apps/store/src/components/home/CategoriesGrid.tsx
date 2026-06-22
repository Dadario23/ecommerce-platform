import Link from "next/link";
import Image from "next/image";

interface Category {
  _id: string;
  name: string;
  slug?: string;
  thumbnail?: string;
}

function getSlug(cat: Category) {
  return (
    cat.slug ||
    cat.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Categorías</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
        {categories.map((cat) => {
          const slug = getSlug(cat);
          const hasThumbnail = !!cat.thumbnail?.startsWith("http");

          return (
            <Link
              key={cat._id}
              href={`/category/${slug}`}
              className="group flex flex-col items-center gap-2"
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-blue-400 group-hover:shadow-md transition-all duration-200">
                {hasThumbnail ? (
                  <Image
                    src={cat.thumbnail!}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl text-gray-300">📦</span>
                  </div>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center leading-tight transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
