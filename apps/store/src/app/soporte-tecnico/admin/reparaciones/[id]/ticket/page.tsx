"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Reparacion {
  _id: string;
  codigo: string;
  cliente: { nombre: string; telefono: string; email?: string };
  equipo: { tipo: string; marca: string; modelo: string };
  fallas: string[];
  presupuesto?: number;
  notaCliente?: string;
  createdAt: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-20 shrink-0">{label}:</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rep, setRep] = useState<Reparacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reparaciones/${id}`)
      .then((r) => r.json())
      .then(setRep)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="text-center py-20 text-gray-500">
        Reparación no encontrada.{" "}
        <Link href="/soporte-tecnico/admin/reparaciones" className="text-(--tenant-primary) hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  const trackingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/soporte-tecnico/seguimiento/${rep.codigo}`;
  const fallasFilled = rep.fallas.filter(Boolean);

  return (
    <>
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          #ticket-root, #ticket-root * { visibility: visible; }
          #ticket-root { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between mb-5 max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-(--tenant-primary) text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      <div
        id="ticket-root"
        className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 space-y-0 font-mono"
      >
        {/* Encabezado */}
        <div className="text-center pb-5 border-b border-dashed border-gray-300">
          <p className="text-2xl font-bold tracking-wider text-(--tenant-primary)">COMPUMOBILE</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Ticket de Recepción de Equipo</p>
        </div>

        {/* Orden + fecha */}
        <div className="flex items-start justify-between py-5 border-b border-dashed border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Orden N°</p>
            <p className="text-4xl font-bold text-(--tenant-primary) leading-none mt-1">{rep.codigo}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Recibido el</p>
            <p className="text-sm font-medium text-gray-700 mt-1">{fmtDate(rep.createdAt)}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="py-5 border-b border-dashed border-gray-200 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Cliente</p>
          <Row label="Nombre" value={rep.cliente.nombre} />
          <Row label="Teléfono" value={rep.cliente.telefono} />
          {rep.cliente.email && <Row label="Email" value={rep.cliente.email} />}
        </div>

        {/* Equipo */}
        <div className="py-5 border-b border-dashed border-gray-200 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Equipo</p>
          <Row
            label="Tipo"
            value={rep.equipo.tipo.charAt(0).toUpperCase() + rep.equipo.tipo.slice(1)}
          />
          <Row label="Marca" value={rep.equipo.marca} />
          <Row label="Modelo" value={rep.equipo.modelo} />
        </div>

        {/* Fallas */}
        {fallasFilled.length > 0 && (
          <div className="py-5 border-b border-dashed border-gray-200">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Fallas reportadas</p>
            <ul className="space-y-1.5">
              {fallasFilled.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Presupuesto */}
        {rep.presupuesto != null && (
          <div className="py-5 border-b border-dashed border-gray-200">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Presupuesto estimado</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              ${rep.presupuesto.toLocaleString("es-AR")}
            </p>
          </div>
        )}

        {/* Nota cliente */}
        {rep.notaCliente && (
          <div className="py-5 border-b border-dashed border-gray-200">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Nota</p>
            <p className="text-sm text-gray-700 italic mt-1">{rep.notaCliente}</p>
          </div>
        )}

        {/* Seguimiento */}
        <div className="py-5 border-b border-dashed border-gray-200">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
            Seguí el estado de tu equipo en:
          </p>
          <p className="text-xs text-(--tenant-primary) break-all mt-1">{trackingUrl}</p>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-10 pt-8">
          <div>
            <div className="border-b border-gray-400 w-full mb-2" />
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Firma del cliente</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-full mb-2" />
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Fecha de entrega</p>
          </div>
        </div>
      </div>
    </>
  );
}
