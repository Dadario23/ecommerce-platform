import { getModels } from "@/lib/tenant-models";
import HomeProductCard from "./HomeProductCard";

interface ProductDoc {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
}

async function getFeaturedProducts(): Promise<ProductDoc[]> {
  const { Product } = await getModels();

  const ACTIVE = { isActive: { $ne: false } };

  const featured = await Product.find({ featured: true, ...ACTIVE })
    .select("name slug price compareAtPrice images brand")
    .limit(8)
    .lean<ProductDoc[]>();

  if (featured.length > 0) return featured;

  return Product.find(ACTIVE)
    .select("name slug price compareAtPrice images brand")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean<ProductDoc[]>();
}

export default async function HomeProductsSection() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="mt-10 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Productos destacados</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <HomeProductCard
            key={String(p._id)}
            id={String(p._id)}
            slug={p.slug}
            image={p.images?.[0] ?? ""}
            name={p.name}
            price={p.price}
            compareAtPrice={p.compareAtPrice}
            brand={p.brand}
          />
        ))}
      </div>
    </section>
  );
}
