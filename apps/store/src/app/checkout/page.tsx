import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";
import { getShippingEnabled } from "@/lib/getShippingEnabled";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const shippingEnabled = await getShippingEnabled();

  return (
    <Suspense
      fallback={
        <div className="pt-20 md:pt-32 text-center">Cargando checkout…</div>
      }
    >
      <CheckoutClient shippingEnabled={shippingEnabled} />
    </Suspense>
  );
}
