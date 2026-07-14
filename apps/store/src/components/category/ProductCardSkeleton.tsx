interface Props {
  listView?: boolean;
}

export default function ProductCardSkeleton({ listView = false }: Props) {
  if (listView) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 flex items-stretch gap-4 p-3 overflow-hidden animate-pulse">
        <div className="relative w-36 sm:w-44 aspect-square shrink-0 rounded-lg bg-gray-100" />
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-2">
          <div className="space-y-1.5">
            <div className="h-2.5 bg-gray-100 rounded w-1/4" />
            <div className="h-3.5 bg-gray-100 rounded w-full" />
            <div className="h-3.5 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col animate-pulse">
      <div className="relative w-full aspect-square bg-gray-100" />
      <div className="p-3 flex flex-col gap-1.5">
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        <div className="h-3.5 bg-gray-100 rounded w-full" />
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mt-1" />
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}
