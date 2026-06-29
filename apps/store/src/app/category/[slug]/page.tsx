import { cache } from "react";
import { notFound } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import CategoryClient from "@/components/category/CategoryClient";
import type { Metadata } from "next";
import { slugify } from "@/lib/slugify";
import { getShippingEnabled } from "@/lib/getShippingEnabled";
import { getClientConfig } from "@/config/client";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

// cache() deduplicates calls within the same request —
// generateMetadata and the page component share one DB round-trip.
const getCategoryAndProducts = cache(async (slug: string) => {
  const { Category, Product } = await getModels();

  const requestedSlug = slugify(decodeURIComponent(slug));

  // Try direct slug field first (populated for categories saved after the slug field was added).
  // Fall back to name-based matching for categories that predate the field.
  let category = await Category.findOne(
    { slug: requestedSlug, status: "published" },
    "name slug thumbnail",
  ).lean<{ _id: unknown; name: string; slug?: string; thumbnail?: string }>();

  if (!category) {
    const all = await Category.find(
      { status: "published" },
      "name slug thumbnail",
    ).lean<{ _id: unknown; name: string; slug?: string; thumbnail?: string }[]>();
    category = all.find((c) => slugify(c.name) === requestedSlug) ?? null;
  }

  if (!category) return null;

  const products = await Product.find({ category: category._id, isActive: { $ne: false } })
    .select("name slug price compareAtPrice images brand stock condition shippingTypes freeShipping")
    .sort({ freeShipping: -1, createdAt: -1 })
    .lean();

  return {
    category,
    products: JSON.parse(JSON.stringify(products)),
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryAndProducts(slug);
  if (!data) return { title: "Categoría no encontrada" };

  return {
    title: `${data.category.name} | ${(await getClientConfig()).storeName}`,
    description: `Explorá nuestra selección de ${data.category.name}. Encontrá los mejores precios y opciones de financiación.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [data, shippingEnabled] = await Promise.all([
    getCategoryAndProducts(slug),
    getShippingEnabled(),
  ]);

  if (!data) notFound();

  return (
    <CategoryClient
      categoryName={data.category.name}
      initialProducts={data.products}
      shippingEnabled={shippingEnabled}
    />
  );
}
