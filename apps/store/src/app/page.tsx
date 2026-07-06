import TechHome from "@/components/home/variants/TechHome";
import EditorialHome from "@/components/home/variants/EditorialHome";
import type { HomeCategory, HomeData } from "@/components/home/variants/types";

import { getModels } from "@/lib/tenant-models";
import { getClientConfig } from "@/config/client";

export const revalidate = 60;

async function getPageData(): Promise<HomeData> {
  try {
    const { Category, Setting } = await getModels();
    const [categoriesRaw, setting] = await Promise.all([
      Category.find({ status: "published" }, "name slug description thumbnail bannerImage")
        .sort({ name: 1 })
        .lean<HomeCategory[]>(),
      Setting.findOne({}, "carouselImages homeFeaturedMode").lean<{
        carouselImages?: string[];
        homeFeaturedMode?: "products" | "categories";
      }>(),
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
    };
  } catch {
    return {
      categories: [],
      categoriesWithImages: [],
      carouselImages: [],
      homeFeaturedMode: "products" as const,
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
      benefits={theme.benefits}
    />
  ) : (
    <TechHome
      {...data}
      showSupport={modules.repairs}
      benefits={theme.benefits}
    />
  );
}
