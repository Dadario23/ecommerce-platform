import { cache } from "react";
import { notFound } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { type IProduct } from "@/models/Product";
import ProductPageClient from "./ProductPageClient";
import type { Metadata } from "next";
import { getShippingEnabled } from "@/lib/getShippingEnabled";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug).toLowerCase().replace(/\s+/g, "-");
}

// cache() deduplicates calls within the same request —
// generateMetadata and the page component share one DB round-trip.
const getProduct = cache(async (slug: string) => {
  const { Product } = await getModels();
  const doc = await Product.findOne({ slug: normalizeSlug(slug), isActive: { $ne: false } })
    .populate("category", "name slug")
    .lean<IProduct>();
  return doc ? (JSON.parse(JSON.stringify(doc)) as IProduct) : null;
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} | Compumobile`,
    description: product.description?.slice(0, 160) ?? `Comprá ${product.name} al mejor precio.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return notFound();

  const categoryId =
    product.category && typeof product.category === "object"
      ? String((product.category as { _id: string })._id)
      : null;
  const productId = String(product._id);

  const { Product, Review } = await getModels();

  // Fetch related data in parallel on the server — no client-side waterfalls.
  const [similarProducts, initialReviews, shippingEnabled] = await Promise.all([
    categoryId
      ? Product.find({ category: categoryId, _id: { $ne: productId }, stock: { $gt: 0 }, isActive: { $ne: false } })
          .sort({ featured: -1, avgRating: -1, createdAt: -1 })
          .limit(8)
          .select("name slug price compareAtPrice images avgRating reviewCount")
          .lean()
          .then((docs) => JSON.parse(JSON.stringify(docs)))
      : [],
    Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean()
      .then((docs) => JSON.parse(JSON.stringify(docs))),
    getShippingEnabled(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images ?? [],
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${product.slug}`,
      priceCurrency: "ARS",
      price: product.price,
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient
        product={product}
        similarProducts={similarProducts}
        initialReviews={initialReviews}
        shippingEnabled={shippingEnabled}
      />
    </>
  );
}
