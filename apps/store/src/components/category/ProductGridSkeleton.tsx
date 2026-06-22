import ProductCardSkeleton from "./ProductCardSkeleton";

interface Props {
  items?: number;
}

export default function ProductGridSkeleton({ items = 9 }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
