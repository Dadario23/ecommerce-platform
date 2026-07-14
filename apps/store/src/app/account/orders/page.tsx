import { Suspense } from "react";
import OrdersClient, { OrderSkeleton } from "./OrdersClient";

// 👇 CLAVE ABSOLUTA
export const dynamic = "force-dynamic";

function OrdersLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 bg-gray-100 rounded w-48 animate-pulse mb-2" />
      <div className="h-3 bg-gray-100 rounded w-24 animate-pulse mb-5" />
      {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersClient />
    </Suspense>
  );
}
