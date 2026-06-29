"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-(--tenant-primary) text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimir etiqueta
    </button>
  );
}
