import { Suspense } from "react";
import AddressesClient from "./AddressesClient";

export const dynamic = "force-dynamic";

export default function AddressesPage() {
  return (
    <Suspense fallback={<div>Cargando direcciones…</div>}>
      <AddressesClient />
    </Suspense>
  );
}
