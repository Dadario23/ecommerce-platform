import TechHome from "@/components/home/variants/TechHome";
import EditorialHome from "@/components/home/variants/EditorialHome";
import type { HomeCategory, HomeData, HomeReelItem } from "@/components/home/variants/types";

import { getModels } from "@/lib/tenant-models";
import { getClientConfig } from "@/config/client";

export const revalidate = 60;

interface ReelProductDoc {
  slug: string;
  name: string;
  reels?: { url: string; thumbnailUrl?: string; order: number }[];
}

async function getFeaturedReels(): Promise<HomeReelItem[]> {
  const { Product } = await getModels();
  const ACTIVE = { isActive: { $ne: false }, reels: { $exists: true, $ne: [] } };

  const withReels = async (query: Record<string, unknown>) =>
    Product.find(query)
      .select("name slug reels")
      .limit(10)
      .lean<ReelProductDoc[]>();

  let products = await withReels({ featured: true, ...ACTIVE });
  if (products.length === 0) {
    products = await Product.find(ACTIVE)
      .select("name slug reels")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<ReelProductDoc[]>();
  }

  return products
    .map((p): HomeReelItem | null => {
      const first = [...(p.reels ?? [])].sort((a, b) => a.order - b.order)[0];
      if (!first) return null;
      return {
        productSlug: p.slug,
        productName: p.name,
        url: first.url,
        thumbnailUrl: first.thumbnailUrl,
      };
    })
    .filter((r): r is HomeReelItem => r !== null);
}

async function getPageData(): Promise<HomeData> {
  try {
    const { Category, Setting } = await getModels();
    const [categoriesRaw, setting, reels] = await Promise.all([
      Category.find({ status: "published" }, "name slug description thumbnail bannerImage")
        .sort({ name: 1 })
        .lean<HomeCategory[]>(),
      Setting.findOne({}, "carouselImages homeFeaturedMode").lean<{
        carouselImages?: string[];
        homeFeaturedMode?: "products" | "categories";
      }>(),
      getFeaturedReels(),
    ]);

    const categories: HomeCategory[] = JSON.parse(JSON.stringify(categoriesRaw));

    // Pre-filter categories that have an image for HomeCategoriesSection
    const categoriesWithImages = categories
      .filter((c) => c.bannerImage || c.thumbnail)
      .slice(0, 4);

    return {
      categories,
      categoriesWithImages,
      carouselImages:   setting?.carouselImages   ?? [],
      homeFeaturedMode: setting?.homeFeaturedMode ?? "products",
      reels,
    };
  } catch {
    return {
      categories: [],
      categoriesWithImages: [],
      carouselImages: [],
      homeFeaturedMode: "products" as const,
      reels: [],
    };
  }
}

export default async function HomePage() {
  const [data, { storeName, modules, theme }] = await Promise.all([
    getPageData(),
    getClientConfig(),
  ]);

  return theme.homeVariant === "editorial" ? (
    <EditorialHome
      {...data}
      storeName={storeName}
      logo={theme.logo}
      showSupport={modules.repairs}
      reelsEnabled={modules.reels}
      benefits={theme.benefits}
    />
  ) : (
    <TechHome
      {...data}
      showSupport={modules.repairs}
      reelsEnabled={modules.reels}
      benefits={theme.benefits}
    />
  );
}
