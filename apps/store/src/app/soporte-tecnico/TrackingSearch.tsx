"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function TrackingSearch() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    router.push(`/soporte-tecnico/seguimiento/${clean}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej: CM-0001"
          className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary) placeholder:text-gray-400 font-mono uppercase tracking-widest"
        />
      </div>
      <button
        type="submit"
        disabled={!code.trim()}
        className="bg-(--tenant-primary) hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  );
}
