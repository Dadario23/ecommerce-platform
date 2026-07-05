import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";

export default function SupportBanner() {
  return (
    <Link
      href="/soporte-tecnico"
      className="group flex items-center justify-between gap-4 bg-(--tenant-primary) hover:bg-(--tenant-primary-hover) text-(--tenant-on-primary) rounded-2xl px-5 py-4 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Wrench className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">¿Tu equipo necesita reparación?</p>
          <p className="text-xs text-(--tenant-on-primary)/70">Obtené un presupuesto al instante · Celulares y computadoras</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-(--tenant-on-primary)/80 group-hover:translate-x-1 transition-transform shrink-0" />
    </Link>
  );
}
