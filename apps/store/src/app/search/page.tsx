import { Suspense } from "react";
import SearchClient from "./SearchClient";
import { getShippingEnabled } from "@/lib/getShippingEnabled";
import { getClientConfig } from "@/config/client";
import ProductGridSkeleton from "@/components/category/ProductGridSkeleton";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [shippingEnabled, { theme }] = await Promise.all([
    getShippingEnabled(),
    getClientConfig(),
  ]);
  const gridCards = theme.cardStyle === "minimal";

  return (
    <Suspense
      fallback={
        <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 my-4 animate-pulse" />
            <div className="flex gap-6 items-start">
              <aside className="w-60 hidden md:block shrink-0">
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </aside>
              <section className="flex-1 min-w-0">
                <ProductGridSkeleton items={6} listView={!gridCards} />
              </section>
            </div>
          </div>
        </main>
      }
    >
      <SearchClient
        shippingEnabled={shippingEnabled}
        gridCards={gridCards}
      />
    </Suspense>
  );
}
