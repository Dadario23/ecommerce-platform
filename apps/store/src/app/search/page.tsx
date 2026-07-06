import { Suspense } from "react";
import SearchClient from "./SearchClient";
import { getShippingEnabled } from "@/lib/getShippingEnabled";
import { getClientConfig } from "@/config/client";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [shippingEnabled, { theme }] = await Promise.all([
    getShippingEnabled(),
    getClientConfig(),
  ]);

  return (
    <Suspense
      fallback={<div className="pt-20 md:pt-32 p-6">Cargando búsqueda...</div>}
    >
      <SearchClient
        shippingEnabled={shippingEnabled}
        gridCards={theme.cardStyle === "minimal"}
      />
    </Suspense>
  );
}
