import Carousel from "@/components/Carousel";
import BenefitsBar from "@/components/BenefitsBar";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import HomeProductsSection from "@/components/home/HomeProductsSection";
import HomeCategoriesSection from "@/components/home/HomeCategoriesSection";
import SupportBanner from "@/components/home/SupportBanner";
import type { TenantTheme } from "@/config/tenant-themes";
import type { HomeData } from "./types";

type TechHomeProps = HomeData & {
  showSupport: boolean;
  benefits: TenantTheme["benefits"];
};

export default function TechHome({
  categories,
  categoriesWithImages,
  carouselImages,
  homeFeaturedMode,
  showSupport,
  benefits,
}: TechHomeProps) {
  return (
    <main className="pt-20 md:pt-32">
      <div className="px-3 sm:px-4 max-w-7xl mx-auto">
        <Carousel images={carouselImages.length ? carouselImages : undefined} />
      </div>

      <BenefitsBar items={benefits} />

      <div className="px-4 max-w-7xl mx-auto">
        {showSupport && (
          <div className="mt-6 mb-6">
            <SupportBanner />
          </div>
        )}
        <CategoriesGrid categories={categories} />

        {homeFeaturedMode === "categories"
          ? <HomeCategoriesSection categories={categoriesWithImages} />
          : <HomeProductsSection />
        }
      </div>
    </main>
  );
}
