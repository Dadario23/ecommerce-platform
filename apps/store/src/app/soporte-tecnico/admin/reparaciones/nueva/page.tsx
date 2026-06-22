import { Suspense } from "react";
import NuevaReparacionForm from "./NuevaReparacionForm";
import { Loader2 } from "lucide-react";

export default async function NuevaReparacionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <NuevaReparacionForm presupuestoId={from} />
    </Suspense>
  );
}
