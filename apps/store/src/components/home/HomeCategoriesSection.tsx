import { getModels } from "@/lib/tenant-models";
import CategoryBlock from "./CategoryBlock";
import { slugify } from "@/lib/slugify";

interface CatDoc {
  _id: string;
  name: string;
  slug?: string;
  bannerImage?: string;
  thumbnail?: string;
}

interface ProductDoc {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  category: unknown;
}

interface Props {
  categories: CatDoc[];
}

export default async function HomeCategoriesSection({ categories }: Props) {
  if (categories.length === 0) return null;

  const { Product } = await getModels();

  // Single query for all categories instead of one query per category (N+1)
  const categoryIds = categories.map((c) => c._id);
  const allProducts = await Product.find({
    category: { $in: categoryIds },
    stock: { $gt: 0 },
    isActive: { $ne: false },
  })
    .select("name slug price compareAtPrice images brand category")
    .sort({ featured: -1, createdAt: -1 })
    .lean<ProductDoc[]>();

  // Group up to 3 products per category
  const productsByCategory = new Map<string, ProductDoc[]>();
  for (const p of allProducts) {
    const catId = String(p.category);
    const bucket = productsByCategory.get(catId) ?? [];
    if (bucket.length < 3) {
      bucket.push(p);
      productsByCategory.set(catId, bucket);
    }
  }

  const data = categories
    .map((cat) => ({ cat, products: productsByCategory.get(cat._id) ?? [] }))
    .filter(({ products }) => products.length > 0);

  if (data.length === 0) return null;

  return (
    <section className="mt-10 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Destacados por categoría</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.map(({ cat, products }) => (
          <CategoryBlock
            key={cat._id}
            bannerImage={cat.bannerImage ?? ""}
            thumbnail={cat.thumbnail ?? ""}
            bannerTitle={cat.name}
            categorySlug={cat.slug ?? slugify(cat.name)}
            products={products}
          />
        ))}
      </div>
    </section>
  );
}
