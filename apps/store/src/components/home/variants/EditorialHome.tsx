import BenefitsBar from "@/components/BenefitsBar";
import HomeProductsSection from "@/components/home/HomeProductsSection";
import SupportBanner from "@/components/home/SupportBanner";
import EditorialHero from "./EditorialHero";
import EditorialCategories from "./EditorialCategories";
import type { TenantTheme } from "@/config/tenant-themes";
import type { HomeData } from "./types";

type EditorialHomeProps = HomeData & {
  storeName: string;
  showSupport: boolean;
  benefits: TenantTheme["benefits"];
};

export default function EditorialHome({
  categoriesWithImages,
  carouselImages,
  storeName,
  showSupport,
  benefits,
}: EditorialHomeProps) {
  return (
    <main className="pt-16 md:pt-28">
      <EditorialHero
        image={carouselImages[0] ?? "/carousel-placeholder.png"}
        storeName={storeName}
      />

      <BenefitsBar items={benefits} variant="light" />

      <div className="px-4 max-w-6xl mx-auto">
        {showSupport && (
          <div className="mt-8">
            <SupportBanner />
          </div>
        )}

        <EditorialCategories categories={categoriesWithImages} />

        <div id="destacados">
          <HomeProductsSection layout="airy" />
        </div>
      </div>
    </main>
  );
}
