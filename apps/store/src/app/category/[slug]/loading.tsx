import ProductGridSkeleton from "@/components/category/ProductGridSkeleton";

export default function Loading() {
  return (
    <main className="pt-20 md:pt-32 px-4 max-w-7xl mx-auto">
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="w-64 hidden md:block">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-4/5"></div>
          </div>
        </aside>

        {/* Skeleton del grid de productos */}
        <section className="flex-1">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <ProductGridSkeleton items={9} />
        </section>
      </div>
    </main>
  );
}
