"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Reparacion {
  _id: string;
  codigo: string;
  cliente: { nombre: string; telefono: string };
  equipo: { tipo: string; marca: string; modelo: string };
  createdAt: string;
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function EtiquetaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rep, setRep] = useState<Reparacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  const trackingUrl = `${origin}/soporte-tecnico/admin/reparaciones/${rep._id}`;
  const nombreCorto =
    rep.cliente.nombre.length > 22
      ? rep.cliente.nombre.slice(0, 20) + "…"
      : rep.cliente.nombre;
  const equipoLabel = `${rep.equipo.marca} ${rep.equipo.modelo}`.slice(0, 28);

  return (
    <>
      <style>{`
        @media print {
          @page { size: 85mm 54mm; margin: 0; }
          body > * { visibility: hidden; }
          #etiqueta-root, #etiqueta-root * { visibility: visible; }
          #etiqueta-root {
            position: fixed;
            top: 0; left: 0;
            width: 85mm; height: 54mm;
            padding: 0;
            margin: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between mb-5 max-w-md mx-auto">
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
          Imprimir etiqueta
        </button>
      </div>

      <div className="no-print text-center mb-4 text-xs text-gray-400">
        Tamaño de impresión: 85 × 54 mm (tarjeta de crédito)
      </div>

      {/* Etiqueta */}
      <div
        id="etiqueta-root"
        className="mx-auto bg-white border-2 border-gray-800 rounded-lg overflow-hidden"
        style={{ width: 340, height: 216 }} /* 2× escala para pantalla */
      >
        <div className="flex h-full">
          {/* QR */}
          <div className="flex items-center justify-center bg-white shrink-0 p-3 border-r-2 border-dashed border-gray-300"
               style={{ width: 120 }}>
            {origin && (
              <QRCodeSVG
                value={trackingUrl}
                size={94}
                level="M"
                includeMargin={false}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between flex-1 px-3 py-2.5 min-w-0">
            {/* Top: brand */}
            <div>
              <p
                className="font-bold text-(--tenant-primary) tracking-widest uppercase"
                style={{ fontSize: 9, letterSpacing: "0.15em" }}
              >
                COMPUMOBILE
              </p>
            </div>

            {/* Middle: code + equipment */}
            <div className="space-y-0.5">
              <p
                className="font-black text-gray-900 leading-none"
                style={{ fontSize: 28 }}
              >
                {rep.codigo}
              </p>
              <p
                className="font-semibold text-gray-700 truncate"
                style={{ fontSize: 11 }}
              >
                {equipoLabel}
              </p>
              <p
                className="text-gray-500 truncate"
                style={{ fontSize: 10 }}
              >
                {nombreCorto}
              </p>
            </div>

            {/* Bottom: date + scan hint */}
            <div className="flex items-end justify-between">
              <p style={{ fontSize: 9 }} className="text-gray-400">
                {fmtDateShort(rep.createdAt)}
              </p>
              <p style={{ fontSize: 8 }} className="text-gray-400 italic">
                Escaneá para ver detalle
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="no-print text-center mt-4 text-xs text-gray-400">
        Ajustá el zoom del navegador al 100% antes de imprimir para obtener el tamaño exacto.
      </p>
    </>
  );
}
