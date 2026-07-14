import ProductCardSkeleton from "./ProductCardSkeleton";

interface Props {
  items?: number;
  listView?: boolean;
}

export default function ProductGridSkeleton({ items = 9, listView = false }: Props) {
  if (listView) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: items }).map((_, i) => (
          <ProductCardSkeleton key={i} listView />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
