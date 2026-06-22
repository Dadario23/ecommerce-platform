"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Printer,
} from "lucide-react";
import PatternLock, { PatternDisplay } from "@/components/PatternLock";
import {
  ESTADOS,
  ESTADO_LABEL,
  ESTADO_COLOR,
  EstadoReparacion,
} from "@/lib/reparacion-config";

interface HistorialItem {
  estado: EstadoReparacion;
  fecha: string;
  nota?: string;
}

interface Reparacion {
  _id: string;
  codigo: string;
  cliente: { nombre: string; telefono: string; email?: string };
  equipo: { tipo: string; marca: string; modelo: string };
  fallas: string[];
  presupuesto?: number;
  estado: EstadoReparacion;
  historial: HistorialItem[];
  notaInterna?: string;
  notaCliente?: string;
  tipoAcceso?: "pin" | "patron" | "contrasena" | "sin_acceso";
  codigoAcceso?: string;
  createdAt: string;
}

type TipoAcceso = "pin" | "patron" | "contrasena" | "sin_acceso";

const EQUIPO_ICON: Record<string, string> = { celular: "📱", laptop: "💻", pc: "🖥️" };

function fmtDate(d: string) {
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1E3A8A] placeholder:text-gray-400";

export default function EditarReparacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rep, setRep] = useState<Reparacion | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  const [nuevoEstado, setNuevoEstado] = useState<EstadoReparacion | "">("");
  const [notaCambio, setNotaCambio] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [fallas, setFallas] = useState<string[]>([]);
  const [presupuesto, setPresupuesto] = useState("");
  const [notaCliente, setNotaCliente] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [savingData, setSavingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [dataOk, setDataOk] = useState(false);

  const [tipoAcceso, setTipoAcceso] = useState<TipoAcceso | "">("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [showCodigo, setShowCodigo] = useState(false);
  const [editingAcceso, setEditingAcceso] = useState(false);
  const [savingAcceso, setSavingAcceso] = useState(false);
  const [accesoOk, setAccesoOk] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reparaciones/${id}`)
      .then((r) => r.json())
      .then((data: Reparacion) => {
        setRep(data);
        setNombre(data.cliente.nombre);
        setTelefono(data.cliente.telefono);
        setEmail(data.cliente.email ?? "");
        setMarca(data.equipo.marca);
        setModelo(data.equipo.modelo);
        setFallas(data.fallas.length ? data.fallas : [""]);
        setPresupuesto(data.presupuesto ? String(data.presupuesto) : "");
        setNotaCliente(data.notaCliente ?? "");
        setNotaInterna(data.notaInterna ?? "");
        setTipoAcceso(data.tipoAcceso ?? "");
        setCodigoAcceso(data.codigoAcceso ?? "");
        setEditingAcceso(!data.tipoAcceso);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [id]);

  function copyLink() {
    if (!rep) return;
    const url = `${window.location.origin}/soporte-tecnico/seguimiento/${rep.codigo}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveStatus() {
    if (!nuevoEstado || !rep) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/reparaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, nota: notaCambio.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      const updated: Reparacion = await res.json();
      setRep(updated);
      setNuevoEstado("");
      setNotaCambio("");
    } catch {
      alert("Error al cambiar el estado");
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveAcceso() {
    setSavingAcceso(true);
    try {
      const res = await fetch(`/api/reparaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoAcceso: tipoAcceso || null,
          codigoAcceso: tipoAcceso && tipoAcceso !== "sin_acceso" ? codigoAcceso.trim() || null : null,
        }),
      });
      if (res.ok) {
        const updated: Reparacion = await res.json();
        setRep(updated);
        setEditingAcceso(false);
        setAccesoOk(true);
        setTimeout(() => setAccesoOk(false), 2500);
      }
    } catch {
      // silent
    } finally {
      setSavingAcceso(false);
    }
  }

  async function saveData() {
    if (!rep) return;
    setDataError("");
    setDataOk(false);
    setSavingData(true);
    try {
      const res = await fetch(`/api/reparaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: { nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim() || undefined },
          equipo: { marca: marca.trim(), modelo: modelo.trim() },
          fallas: fallas.filter((f) => f.trim()),
          presupuesto: presupuesto || undefined,
          notaCliente: notaCliente.trim() || undefined,
          notaInterna: notaInterna.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Reparacion = await res.json();
      setRep(updated);
      setDataOk(true);
      setTimeout(() => setDataOk(false), 2500);
    } catch {
      setDataError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSavingData(false);
    }
  }

  if (fetching) {
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
        <Link href="/soporte-tecnico/admin/reparaciones" className="text-[#1E3A8A] hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  const trackingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/soporte-tecnico/seguimiento/${rep.codigo}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/soporte-tecnico/admin/reparaciones")}
          className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[#1E3A8A] text-lg">{rep.codigo}</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[rep.estado]}`}>
              {ESTADO_LABEL[rep.estado]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {EQUIPO_ICON[rep.equipo.tipo]} {rep.equipo.marca} {rep.equipo.modelo} · {rep.cliente.nombre}
          </p>
        </div>
      </div>

      {/* Tracking link */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700 mb-0.5">Link de seguimiento para el cliente</p>
          <p className="text-xs text-blue-600 truncate font-mono">{trackingUrl}</p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-200 bg-white rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Acciones de impresión */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/soporte-tecnico/admin/reparaciones/${id}/ticket`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#1E3A8A] border border-[#1E3A8A]/30 bg-blue-50/50 rounded-2xl hover:bg-blue-100 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Ticket de recepción
        </a>
        <a
          href={`/soporte-tecnico/admin/reparaciones/${id}/etiqueta`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Etiqueta QR
        </a>
      </div>

      {/* Estado */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cambiar estado</p>
        <div className="grid grid-cols-2 gap-2">
          {(ESTADOS as EstadoReparacion[]).map((e) => (
            <button
              key={e}
              type="button"
              disabled={e === rep.estado}
              onClick={() => setNuevoEstado(e === nuevoEstado ? "" : e)}
              className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                e === rep.estado
                  ? `${ESTADO_COLOR[e]} border-transparent opacity-60 cursor-default`
                  : nuevoEstado === e
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {e === rep.estado && "✓ "}
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>

        {nuevoEstado && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700">Nota para el cliente (opcional)</label>
            <textarea
              value={notaCambio}
              onChange={(e) => setNotaCambio(e.target.value)}
              rows={2}
              placeholder="Ej: Tu equipo ya está listo para retirar."
              className={`${inputCls} resize-none`}
            />
            <button
              onClick={saveStatus}
              disabled={savingStatus}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {savingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar estado → {ESTADO_LABEL[nuevoEstado]}
            </button>
          </div>
        )}

        {rep.cliente.telefono ? (
          <a
            href={`https://wa.me/${rep.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Hola ${rep.cliente.nombre}! El estado de tu reparación (${rep.codigo}) es: *${ESTADO_LABEL[rep.estado]}*. Podés ver el seguimiento en: ${trackingUrl}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-[#25D366] border border-[#25D366]/30 rounded-xl px-4 py-2.5 hover:bg-green-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Notificar al cliente por WhatsApp
          </a>
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">
            El cliente no tiene teléfono registrado — no se puede notificar por WhatsApp.
          </p>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Historial</p>
        <div className="space-y-2">
          {[...rep.historial].reverse().map((h, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] mt-1 shrink-0" />
                {i < rep.historial.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="pb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLOR[h.estado]}`}>
                  {ESTADO_LABEL[h.estado]}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(h.fecha)}</p>
                {h.nota && <p className="text-sm text-gray-600 mt-1 italic">{h.nota}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Datos de acceso */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1">Datos de acceso</p>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Solo staff</span>
        </div>

        {!editingAcceso && tipoAcceso ? (
          /* ── VIEW MODE ── */
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Tipo de acceso</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg">
                  <Lock className="w-3 h-3" />
                  {tipoAcceso === "pin" ? "PIN" : tipoAcceso === "patron" ? "Patrón" : tipoAcceso === "contrasena" ? "Contraseña" : "Sin acceso"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingAcceso(true)}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
            </div>

            {tipoAcceso !== "sin_acceso" && (
              codigoAcceso ? (
                tipoAcceso === "patron" ? (
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <p className="text-[11px] text-gray-400">Patrón guardado</p>
                    <PatternDisplay pattern={codigoAcceso} size={130} />
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1.5">
                      {tipoAcceso === "pin" ? "Código PIN" : "Contraseña"}
                    </p>
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <code className="flex-1 font-mono text-base font-bold text-amber-900 tracking-widest select-all">
                        {showCodigo ? codigoAcceso : "•".repeat(Math.min(codigoAcceso.length || 8, 12))}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowCodigo((p) => !p)}
                        className="text-amber-600 hover:text-amber-900 transition-colors p-1"
                      >
                        {showCodigo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-amber-600 italic">
                  No hay código guardado — hacé clic en Editar para ingresarlo.
                </p>
              )
            )}
          </div>
        ) : (
          /* ── EDIT MODE ── */
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Tipo de acceso</label>
              <div className="flex flex-wrap gap-2">
                {(rep.equipo.tipo === "celular"
                  ? [{ val: "pin", label: "PIN" }, { val: "patron", label: "Patrón" }, { val: "sin_acceso", label: "Sin acceso" }]
                  : [{ val: "contrasena", label: "Contraseña" }, { val: "sin_acceso", label: "Sin acceso" }]
                ).map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTipoAcceso(val as TipoAcceso)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      tipoAcceso === val
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tipoAcceso === "patron" && (
              <div className="space-y-3">
                {codigoAcceso ? (
                  <div className="flex flex-col items-center gap-2">
                    <PatternDisplay pattern={codigoAcceso} size={120} />
                    <button type="button"
                      onClick={() => setCodigoAcceso("")}
                      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium hover:underline">
                      <Pencil className="w-3 h-3" />
                      Cambiar patrón
                    </button>
                  </div>
                ) : (
                  <PatternLock onConfirm={(p) => setCodigoAcceso(p)} onCancel={undefined} />
                )}
              </div>
            )}

            {tipoAcceso && tipoAcceso !== "sin_acceso" && tipoAcceso !== "patron" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {tipoAcceso === "pin" ? "Código PIN" : "Contraseña"}
                </label>
                <div className="relative">
                  <input
                    type={showCodigo ? "text" : "password"}
                    value={codigoAcceso}
                    onChange={(e) => setCodigoAcceso(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowCodigo((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCodigo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={saveAcceso}
                disabled={savingAcceso || !tipoAcceso}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {savingAcceso && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {accesoOk ? <><Check className="w-3.5 h-3.5" /> Guardado</> : "Guardar acceso"}
              </button>
              {rep.tipoAcceso && (
                <button
                  type="button"
                  onClick={() => {
                    setTipoAcceso(rep.tipoAcceso ?? "");
                    setCodigoAcceso(rep.codigoAcceso ?? "");
                    setEditingAcceso(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Datos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos de la reparación</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca">
            <input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Modelo">
            <input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Fallas</label>
          {fallas.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={f}
                onChange={(e) => setFallas((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                className={`${inputCls} flex-1`}
              />
              {fallas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFallas((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFallas((f) => [...f, ""])}
            className="flex items-center gap-1.5 text-sm text-[#1E3A8A] font-medium hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar falla
          </button>
        </div>

        <Field label="Presupuesto estimado">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              placeholder="0"
              min={0}
              className={`${inputCls} pl-7`}
            />
          </div>
        </Field>

        <Field label="Nota para el cliente">
          <textarea value={notaCliente} onChange={(e) => setNotaCliente(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Nota interna">
          <textarea value={notaInterna} onChange={(e) => setNotaInterna(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </Field>

        {dataError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{dataError}</p>
        )}

        <button
          onClick={saveData}
          disabled={savingData}
          className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {savingData && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {dataOk ? <><Check className="w-3.5 h-3.5" /> Guardado</> : "Guardar datos"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
