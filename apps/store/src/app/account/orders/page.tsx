import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

// 👇 CLAVE ABSOLUTA
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Cargando pedidos…</div>}>
      <OrdersClient />
    </Suspense>
  );
}
