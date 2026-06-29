"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Wrench, X, Clock } from "lucide-react";

interface PresupuestoItem {
  repair: string;
  price: string;
}

interface Presupuesto {
  id: string;
  cliente: { nombre: string; email?: string };
  equipo: { tipo: string; marca: string; modelo: string };
  items: PresupuestoItem[];
  totalEstimado?: number;
  esGenerico: boolean;
  estado: "pendiente" | "convertido" | "descartado";
  reparacionId?: string;
  createdAt: string;
}

const EQUIPO_ICON: Record<string, string> = { celular: "📱", laptop: "💻", pc: "🖥️" };

const ESTADO_STYLE = {
  pendiente:  "bg-amber-100 text-amber-700",
  convertido: "bg-green-100 text-green-700",
  descartado: "bg-gray-100 text-gray-500",
};

const ESTADO_LABEL = {
  pendiente:  "Pendiente",
  convertido: "Convertido",
  descartado: "Descartado",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function fmtPrice(p: string | number) {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? String(p) : `$${n.toLocaleString("es-AR")}`;
}

export default function PresupuestosClient({ presupuestos: initial }: { presupuestos: Presupuesto[] }) {
  const [pres, setPres] = useState(initial);
  const [filter, setFilter] = useState<"pendiente" | "todos">("pendiente");
  const [loading, setLoading] = useState<string | null>(null);

  const visible = filter === "pendiente" ? pres.filter((p) => p.estado === "pendiente") : pres;
  const pendienteCount = pres.filter((p) => p.estado === "pendiente").length;

  async function discard(id: string) {
    setLoading(id);
    await fetch(`/api/presupuestos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "descartado" }),
    });
    setPres((prev) => prev.map((p) => (p.id === id ? { ...p, estado: "descartado" } : p)));
    setLoading(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Presupuestos del chatbot</h1>
          <p className="text-sm text-gray-500 mt-0.5">Solicitudes recibidas desde el autopresupuesto</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("pendiente")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "pendiente"
                ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            Pendientes
            {pendienteCount > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendienteCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("todos")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "todos"
                ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === "pendiente" ? "No hay presupuestos pendientes" : "No hay presupuestos registrados"}
          </p>
          <p className="text-sm text-gray-400 mt-1">Aparecen cuando los clientes completan el autopresupuesto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 transition-opacity ${p.estado === "descartado" ? "opacity-50" : "border-gray-200"}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{EQUIPO_ICON[p.equipo.tipo] ?? "🔧"}</span>
                    <p className="font-bold text-gray-900">
                      {p.equipo.marca || "Sin marca"} {p.equipo.modelo || "Sin modelo"}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLE[p.estado]}`}>
                      {ESTADO_LABEL[p.estado]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    👤 <span className="font-medium">{p.cliente.nombre}</span>
                    {p.cliente.email && <span className="text-gray-400 text-xs">· {p.cliente.email}</span>}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.items.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700">
                        <span>{item.repair}</span>
                        {item.price !== "a consultar" ? (
                          <span className="text-(--tenant-primary) font-semibold">· {fmtPrice(item.price)}</span>
                        ) : (
                          <span className="text-gray-400">· a consultar</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {p.totalEstimado ? (
                    <p className="text-sm font-bold text-(--tenant-primary) mt-1">
                      Total estimado: ${p.totalEstimado.toLocaleString("es-AR")}
                    </p>
                  ) : (
                    p.esGenerico && (
                      <p className="text-xs text-gray-400 mt-1">Precio a consultar · Equipo sin marca/modelo específico</p>
                    )
                  )}

                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(p.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {p.estado === "pendiente" && (
                    <>
                      <Link
                        href={`/soporte-tecnico/admin/reparaciones/nueva?from=${p.id}`}
                        className="flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Crear reparación
                      </Link>
                      <button
                        onClick={() => discard(p.id)}
                        disabled={loading === p.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Descartar
                      </button>
                    </>
                  )}
                  {p.estado === "convertido" && p.reparacionId && (
                    <Link
                      href={`/soporte-tecnico/admin/reparaciones/${p.reparacionId}`}
                      className="text-xs font-medium text-(--tenant-primary) hover:underline"
                    >
                      Ver reparación →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
