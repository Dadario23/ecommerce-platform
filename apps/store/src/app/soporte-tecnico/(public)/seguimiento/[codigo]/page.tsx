"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Loader2, RefreshCw, AlertCircle, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import {
  FLOW_ORDER,
  ESTADO_LABEL,
  ESTADO_COLOR,
  EstadoReparacion,
} from "@/lib/reparacion-config";

const WA = "5491150610043";
const POLL_INTERVAL = 30_000; // 30 seconds

const EQUIPO_ICON: Record<string, string> = { celular: "📱", laptop: "💻", pc: "🖥️" };
const EQUIPO_LABEL: Record<string, string> = {
  celular: "Celular",
  laptop: "Laptop",
  pc: "PC de escritorio",
};

const ESTADO_MSG: Partial<Record<EstadoReparacion, string>> = {
  recibido: "Tu equipo fue recibido en el taller. Pronto nuestro técnico lo revisará.",
  diagnosticado: "Tu equipo fue diagnosticado. Te informaremos los próximos pasos.",
  en_reparacion: "Tu equipo está siendo reparado por nuestros técnicos.",
  esperando_repuestos: "Estamos esperando la llegada de los repuestos necesarios para continuar.",
  listo: "¡Tu equipo está listo para retirar! Pasá por el taller cuando quieras.",
  entregado: "Tu equipo fue entregado. ¡Gracias por confiar en nosotros!",
  cancelado: "La reparación fue cancelada. Contactanos para más información.",
  sin_reparacion: "Lamentablemente el equipo no tiene reparación posible. Contactanos.",
};

interface HistorialItem {
  estado: EstadoReparacion;
  fecha: string;
  nota?: string;
}

interface Reparacion {
  codigo: string;
  cliente: { nombre: string };
  equipo: { tipo: string; marca: string; modelo: string };
  fallas: string[];
  presupuesto?: number;
  pago?: { estado: "pendiente" | "aprobado" | "rechazado" };
  estado: EstadoReparacion;
  historial: HistorialItem[];
  notaCliente?: string;
}

const PAYABLE_ESTADOS: EstadoReparacion[] = [
  "diagnosticado",
  "en_reparacion",
  "esperando_repuestos",
  "listo",
];

function fmtDate(d: string) {
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isTerminal(estado: EstadoReparacion) {
  return estado === "cancelado" || estado === "sin_reparacion";
}

export default function SeguimientoDetailPage() {
  const { codigo }      = useParams<{ codigo: string }>();
  const searchParams    = useSearchParams();
  const pagoResult      = searchParams.get("pago"); // "ok" | "error" | "pendiente" | null

  const [rep, setRep]             = useState<Reparacion | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const [lastChecked, setLastChecked]     = useState<Date | null>(null);
  const [paying, setPaying]       = useState(false);
  const prevEstado = useRef<EstadoReparacion | null>(null);
  const changeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRep = useCallback(
    async (silent = false) => {
      if (!codigo) return;
      try {
        const res = await fetch(
          `/api/reparaciones/seguimiento/${encodeURIComponent(codigo.toUpperCase())}`,
          { cache: "no-store" },
        );
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) return;
        const data: Reparacion = await res.json();

        // Detect status change (only after initial load)
        if (silent && prevEstado.current && prevEstado.current !== data.estado) {
          setStatusChanged(true);
          if (changeTimeout.current) clearTimeout(changeTimeout.current);
          changeTimeout.current = setTimeout(() => setStatusChanged(false), 5000);
        }
        prevEstado.current = data.estado;
        setRep(data);
        setLastChecked(new Date());
      } catch {
        // silently ignore network errors on background polls
      }
    },
    [codigo],
  );

  useEffect(() => {
    fetchRep(false).finally(() => setLoading(false));
    const interval = setInterval(() => fetchRep(true), POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      if (changeTimeout.current) clearTimeout(changeTimeout.current);
    };
  }, [fetchRep]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="pt-20 md:pt-32 pb-20 bg-gray-50 min-h-screen">
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-(--tenant-primary)" />
          <p className="text-sm text-gray-500">Cargando seguimiento…</p>
        </div>
      </main>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (notFound || !rep) {
    return (
      <main className="pt-20 md:pt-32 pb-20 bg-gray-50 min-h-screen">
        <div className="max-w-lg mx-auto px-4 space-y-5">
          <Link
            href="/soporte-tecnico/seguimiento"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-(--tenant-primary) transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Buscar otro código
          </Link>
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-800">
              No encontramos el código{" "}
              <span className="font-mono text-(--tenant-primary)">{codigo?.toUpperCase()}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Revisá que esté escrito correctamente o contactanos.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const terminal   = isTerminal(rep.estado);
  const currentIdx = FLOW_ORDER.indexOf(rep.estado);
  const waMsg = `Hola! Quisiera consultar sobre mi reparación ${rep.codigo} (${rep.equipo.marca} ${rep.equipo.modelo}).`;
  const waUrl = `https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`;

  const canPay =
    !!rep.presupuesto &&
    rep.presupuesto > 0 &&
    PAYABLE_ESTADOS.includes(rep.estado) &&
    rep.pago?.estado !== "aprobado";

  async function handlePagar() {
    if (!codigo || paying) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/reparacion-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.initPoint;
    } catch (err) {
      alert((err as Error).message || "Error al iniciar el pago. Intentá de nuevo.");
      setPaying(false);
    }
  }

  return (
    <main className="pt-20 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto px-4 space-y-5">

        {/* Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/soporte-tecnico/seguimiento"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-(--tenant-primary) transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Buscar otro código
          </Link>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            En vivo
            {lastChecked && (
              <button
                onClick={() => fetchRep(false)}
                className="ml-1 text-gray-300 hover:text-gray-500 transition-colors"
                title="Actualizar ahora"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Status changed banner */}
        {statusChanged && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 animate-pulse">
            <span className="text-green-600 text-lg">🔔</span>
            <p className="text-sm font-semibold text-green-700">
              ¡El estado de tu reparación fue actualizado!
            </p>
          </div>
        )}

        {/* Status hero */}
        <div className="bg-(--tenant-primary) text-white rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Seguimiento de reparación
              </p>
              <p className="font-mono font-bold text-2xl">{rep.codigo}</p>
              <p className="text-blue-200 text-sm mt-1">
                {EQUIPO_ICON[rep.equipo.tipo]} {rep.equipo.marca} {rep.equipo.modelo}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${ESTADO_COLOR[rep.estado]}`}
            >
              {ESTADO_LABEL[rep.estado]}
            </span>
          </div>
          {ESTADO_MSG[rep.estado] && (
            <p className="text-blue-100 text-sm mt-4 border-t border-white/10 pt-3">
              {ESTADO_MSG[rep.estado]}
            </p>
          )}
        </div>

        {/* Timeline */}
        {!terminal && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Estado del proceso
            </p>
            <div className="flex items-start">
              {FLOW_ORDER.map((estado, idx) => {
                const done = currentIdx > idx;
                const current = currentIdx === idx;
                return (
                  <div key={estado} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-3 h-0.5 ${done || current ? "bg-(--tenant-primary)" : "bg-gray-200"}`}
                        style={{ left: "-50%", width: "100%" }}
                      />
                    )}
                    {/* Circle */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 shrink-0 transition-all duration-500 ${
                        done
                          ? "bg-(--tenant-primary) border-(--tenant-primary)"
                          : current
                            ? "bg-white border-(--tenant-primary) ring-4 ring-blue-100"
                            : "bg-white border-gray-200"
                      }`}
                    >
                      {done && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {current && <div className="w-2 h-2 rounded-full bg-(--tenant-primary)" />}
                    </div>
                    {/* Label */}
                    <p
                      className={`text-center mt-1.5 leading-tight px-0.5 ${
                        current
                          ? "font-bold text-(--tenant-primary)"
                          : done
                            ? "font-medium text-gray-500"
                            : "text-gray-300"
                      }`}
                      style={{ fontSize: "9px" }}
                    >
                      {ESTADO_LABEL[estado]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historial */}
        {rep.historial.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Historial de cambios
            </p>
            <div className="space-y-2">
              {[...rep.historial].reverse().map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-(--tenant-primary) mt-1.5 shrink-0" />
                    {i < rep.historial.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLOR[h.estado]}`}
                    >
                      {ESTADO_LABEL[h.estado]}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(h.fecha)}</p>
                    {h.nota && (
                      <p className="text-sm text-gray-600 mt-1 italic">{h.nota}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalle */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Detalle del equipo
          </p>
          <div className="space-y-2 text-sm">
            <Row
              label="Tipo"
              value={`${EQUIPO_ICON[rep.equipo.tipo]} ${EQUIPO_LABEL[rep.equipo.tipo] ?? rep.equipo.tipo}`}
            />
            <Row label="Marca" value={rep.equipo.marca || "Sin especificar"} />
            <Row label="Modelo" value={rep.equipo.modelo || "Sin especificar"} />
            {rep.fallas.length > 0 && (
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <span className="text-gray-500 shrink-0 w-28">Fallas</span>
                <ul className="space-y-0.5">
                  {rep.fallas.map((f, i) => (
                    <li key={i} className="text-gray-700">
                      • {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rep.presupuesto && (
              <div className="flex gap-2 pt-1 border-t border-gray-100 items-center">
                <span className="text-gray-500 w-28">Presupuesto</span>
                <span className="font-bold text-(--tenant-primary) text-base">
                  ${rep.presupuesto.toLocaleString("es-AR")}
                </span>
              </div>
            )}
          </div>
          {rep.notaCliente && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">Mensaje del técnico</p>
              <p className="text-sm text-gray-700 italic">{rep.notaCliente}</p>
            </div>
          )}
        </div>

        {/* ── Resultado del pago (vuelta desde MP) ── */}
        {pagoResult === "ok" || rep.pago?.estado === "aprobado" ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800 text-sm">¡Pago recibido!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Tu pago fue procesado correctamente. Te avisaremos cuando tu equipo esté listo para retirar.
              </p>
            </div>
          </div>
        ) : pagoResult === "error" ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700 text-sm">El pago no se completó</p>
              <p className="text-xs text-red-600 mt-0.5">
                Podés intentarlo de nuevo o consultarnos por WhatsApp.
              </p>
            </div>
          </div>
        ) : pagoResult === "pendiente" ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <Loader2 className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-amber-700 text-sm">Pago en proceso</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Tu pago está siendo verificado. Te notificaremos cuando se confirme.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Pagar con Mercado Pago ── */}
        {canPay && (
          <div className="rounded-2xl border-2 border-(--tenant-primary) bg-blue-50 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">Pagá tu reparación online</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Presupuesto aprobado · tarjeta, transferencia o cuotas
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-(--tenant-primary)">
                  ${rep.presupuesto!.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
            <button
              onClick={handlePagar}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo…</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pagar con Mercado Pago</>
              )}
            </button>
          </div>
        )}

        {/* WhatsApp CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm px-5 py-3 rounded-2xl transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Consultar por WhatsApp
        </a>

        {/* Last updated */}
        {lastChecked && (
          <p className="text-center text-xs text-gray-400">
            Última actualización: {lastChecked.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            {" · "}actualiza automáticamente cada 30 segundos
          </p>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
