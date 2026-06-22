import { Suspense } from "react";
import SearchClient from "./SearchClient";
import { getShippingEnabled } from "@/lib/getShippingEnabled";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const shippingEnabled = await getShippingEnabled();

  return (
    <Suspense
      fallback={<div className="pt-20 md:pt-32 p-6">Cargando búsqueda...</div>}
    >
      <SearchClient shippingEnabled={shippingEnabled} />
    </Suspense>
  );
}
