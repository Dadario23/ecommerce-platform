"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  Printer,
} from "lucide-react";
import PatternLock, { PatternDisplay } from "@/components/PatternLock";

type TipoAcceso = "pin" | "patron" | "contrasena" | "sin_acceso";

type DeviceType = "celular" | "laptop" | "pc";

interface RegisteredClient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CatalogModel { brand: string; model: string }
interface CatalogPrice { brand: string; model: string; repairType: string; price: number }

const TIPO_LABEL: Record<DeviceType, string> = {
  celular: "Celular",
  laptop: "Laptop",
  pc: "PC",
};

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary) placeholder:text-gray-400";

const selectCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary) text-gray-700 cursor-pointer";

export default function NuevaReparacionForm({ presupuestoId }: { presupuestoId?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  // ── Client resolution ────────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [registeredClient, setRegisteredClient] = useState<RegisteredClient | null>(null);
  const [regPhone, setRegPhone] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailManual, setEmailManual] = useState("");

  // ── Equipment ─────────────────────────────────────────────────────────────
  const [equipoEditing, setEquipoEditing] = useState(false);
  const [tipo, setTipo] = useState<DeviceType>("celular");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [marcaCustom, setMarcaCustom] = useState(false);
  const [modeloCustom, setModeloCustom] = useState(false);

  // Catalog data (loaded once per tipo)
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogBrands, setCatalogBrands] = useState<string[]>([]);
  const [allCatalogModels, setAllCatalogModels] = useState<CatalogModel[]>([]);
  const [allCatalogPrices, setAllCatalogPrices] = useState<CatalogPrice[]>([]);

  // Refs for pre-fill validation
  const initialMarcaRef = useRef("");
  const initialModeloRef = useRef("");

  // ── Fallas ────────────────────────────────────────────────────────────────
  // Unified array: catalog chips + free-text entries coexist
  const [fallas, setFallas] = useState<string[]>([""]);

  // ── Notes & presupuesto ───────────────────────────────────────────────────
  const [presupuesto, setPresupuesto] = useState("");
  const [notaCliente, setNotaCliente] = useState("");
  const [notaInterna, setNotaInterna] = useState("");

  // ── Acceso ────────────────────────────────────────────────────────────────
  const [tipoAcceso, setTipoAcceso] = useState<TipoAcceso | "">("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [showCodigo, setShowCodigo] = useState(false);

  // ── Save state ────────────────────────────────────────────────────────────
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"save" | "register" | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [printModal, setPrintModal] = useState<{ id: string } | null>(null);
  const presupuestoLoadingRef = useRef(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const showInfoCard = !!presupuestoId && !equipoEditing;
  const catalogModels = allCatalogModels.filter((m) => m.brand === marca).map((m) => m.model);
  const catalogRepairTypes = allCatalogPrices
    .filter((p) => p.brand === marca && p.model === modelo)
    .map((p) => p.repairType);
  const isChipMode = !marcaCustom && !modeloCustom && modelo !== "" && catalogRepairTypes.length > 0;

  // Text fallas: entries in fallas[] that are NOT catalog repair types
  const textFallaEntries = fallas
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => !catalogRepairTypes.includes(f));

  // ── Fetch catalog when tipo changes ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogBrands([]);
    setAllCatalogModels([]);
    setAllCatalogPrices([]);

    fetch(`/api/repair-catalog?device=${tipo}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCatalogBrands(data.brands ?? []);
        setAllCatalogModels(data.models ?? []);
        setAllCatalogPrices(data.prices ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCatalogLoading(false); });

    return () => { cancelled = true; };
  }, [tipo]);

  function markChanged() {
    if (!presupuestoLoadingRef.current) setHasChanges(true);
  }

  // ── Load from presupuesto ────────────────────────────────────────────────
  useEffect(() => {
    if (!presupuestoId) return;

    async function load() {
      presupuestoLoadingRef.current = true;
      try {
        const presupRes = await fetch(`/api/presupuestos/${presupuestoId}`);
        const data = await presupRes.json();
        if (data.error) return;

        const newTipo: DeviceType = data.equipo?.tipo ?? "celular";
        const newMarca: string = data.equipo?.marca || "Sin marca";
        const newModelo: string = data.equipo?.modelo || "Sin modelo";

        setTipo(newTipo);
        setMarca(newMarca);
        setModelo(newModelo);
        initialMarcaRef.current = newMarca;
        initialModeloRef.current = newModelo;

        const fallasList: string[] = (data.items ?? []).map((i: { repair: string }) => i.repair);
        setFallas(fallasList.length > 0 ? fallasList : [""]);
        if (data.totalEstimado != null) setPresupuesto(String(data.totalEstimado));

        // Si ya existe una reparación vinculada, cargar sus datos persistidos
        if (data.reparacionId) {
          const repRes = await fetch(`/api/reparaciones/${data.reparacionId}`);
          if (repRes.ok) {
            const rep = await repRes.json();
            setSavedId(String(rep._id));
            if (rep.presupuesto != null) setPresupuesto(String(rep.presupuesto));
            if (rep.notaCliente) setNotaCliente(rep.notaCliente);
            if (rep.notaInterna) setNotaInterna(rep.notaInterna);
            if (rep.equipo?.tipo) setTipo(rep.equipo.tipo);
            if (rep.equipo?.marca) { setMarca(rep.equipo.marca); initialMarcaRef.current = rep.equipo.marca; }
            if (rep.equipo?.modelo) { setModelo(rep.equipo.modelo); initialModeloRef.current = rep.equipo.modelo; }
            if (rep.fallas?.length > 0) setFallas(rep.fallas);
            if (rep.tipoAcceso) setTipoAcceso(rep.tipoAcceso);
            if (rep.codigoAcceso) setCodigoAcceso(rep.codigoAcceso);
          }
        } else {
          // Sin reparación: recuperar borrador local si existe
          try {
            const raw = localStorage.getItem(`reparacion-draft-${presupuestoId}`);
            if (raw) {
              const d = JSON.parse(raw);
              if (d.presupuesto !== undefined) setPresupuesto(d.presupuesto);
              if (d.notaCliente !== undefined) setNotaCliente(d.notaCliente);
              if (d.notaInterna !== undefined) setNotaInterna(d.notaInterna);
              if (d.tipo) setTipo(d.tipo);
              if (d.marca) { setMarca(d.marca); initialMarcaRef.current = d.marca; }
              if (d.modelo) { setModelo(d.modelo); initialModeloRef.current = d.modelo; }
              if (Array.isArray(d.fallas) && d.fallas.length > 0) setFallas(d.fallas);
              if (d.marcaCustom !== undefined) setMarcaCustom(d.marcaCustom);
              if (d.modeloCustom !== undefined) setModeloCustom(d.modeloCustom);
              if (d.tipoAcceso) setTipoAcceso(d.tipoAcceso);
              if (d.codigoAcceso !== undefined) setCodigoAcceso(d.codigoAcceso);
            }
          } catch {
            // borrador corrupto, ignorar
          }
        }

        const clientEmail: string | undefined = data.cliente?.email;
        if (clientEmail) {
          setEmailInput(clientEmail);
          setLookupLoading(true);
          try {
            const userRes = await fetch(
              `/api/staff/client-lookup?email=${encodeURIComponent(clientEmail)}`
            );
            if (userRes.ok) {
              const user: RegisteredClient = await userRes.json();
              setRegisteredClient(user);
              setRegPhone(user.phone || "");
            } else {
              setNombre(data.cliente?.nombre ?? "");
              setEmailManual(clientEmail);
            }
          } catch {
            setNombre(data.cliente?.nombre ?? "");
            setEmailManual(clientEmail);
          } finally {
            setLookupLoading(false);
            setLookupDone(true);
          }
        } else {
          setNombre(data.cliente?.nombre ?? "");
          setLookupDone(true);
        }
      } finally {
        presupuestoLoadingRef.current = false;
      }
    }

    load().catch(() => {});
  }, [presupuestoId]);

  // ── Manual lookup ────────────────────────────────────────────────────────
  async function lookupClient() {
    const email = emailInput.trim();
    if (!email) return;
    setLookupLoading(true);
    setLookupDone(false);
    setRegisteredClient(null);
    try {
      const res = await fetch(`/api/staff/client-lookup?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const user: RegisteredClient = await res.json();
        setRegisteredClient(user);
        setRegPhone(user.phone || "");
      } else {
        setEmailManual(email);
      }
    } catch {
      setEmailManual(email);
    } finally {
      setLookupLoading(false);
      setLookupDone(true);
    }
  }

  function resetClientLookup() {
    setRegisteredClient(null);
    setLookupDone(false);
    setEmailInput("");
    setRegPhone("");
  }

  // ── Equipment handlers ───────────────────────────────────────────────────
  function handleStartEditing() {
    setEquipoEditing(true);
    const initMarca = initialMarcaRef.current;
    const initModelo = initialModeloRef.current;
    if (!initMarca || catalogBrands.length === 0) return;
    if (!catalogBrands.includes(initMarca)) {
      setMarcaCustom(true);
      setModeloCustom(true);
      return;
    }
    if (initModelo) {
      const models = allCatalogModels.filter((m) => m.brand === initMarca).map((m) => m.model);
      if (models.length > 0 && !models.includes(initModelo)) {
        setModeloCustom(true);
      }
    }
  }

  function handleTipoChange(t: DeviceType) {
    setTipo(t);
    setMarca("");
    setModelo("");
    setMarcaCustom(false);
    setModeloCustom(false);
    setFallas([""]);
    markChanged();
  }

  function handleMarcaSelect(value: string) {
    if (value === "__custom__") {
      setMarcaCustom(true);
      setMarca("");
      setModelo("");
      setModeloCustom(false);
    } else {
      setMarca(value);
      setModelo("");
      setModeloCustom(false);
      setFallas([""]);
    }
    markChanged();
  }

  function handleModeloSelect(value: string) {
    if (value === "__custom__") {
      setModeloCustom(true);
      setModelo("");
    } else {
      setModelo(value);
      setFallas([""]);
    }
    markChanged();
  }

  // ── Falla handlers ───────────────────────────────────────────────────────
  function toggleChip(repairType: string) {
    setFallas((prev) =>
      prev.includes(repairType)
        ? prev.filter((f) => f !== repairType)
        : [...prev, repairType]
    );
    markChanged();
  }

  function addTextFalla() {
    setFallas((prev) => [...prev, ""]);
    markChanged();
  }

  function updateTextFalla(originalIndex: number, value: string) {
    setFallas((prev) => prev.map((f, i) => (i === originalIndex ? value : f)));
    markChanged();
  }

  function removeTextFalla(originalIndex: number) {
    setFallas((prev) => prev.filter((_, i) => i !== originalIndex));
    markChanged();
  }

  // ── Shared validation & payload ──────────────────────────────────────────
  function buildPayload() {
    setError("");
    let clienteNombre: string;
    let clienteTelefono: string;
    let clienteEmail: string | undefined;

    if (registeredClient) {
      clienteNombre = registeredClient.name;
      clienteTelefono = regPhone.trim();
      clienteEmail = registeredClient.email;
      if (!clienteTelefono) { setError("Completá el teléfono del cliente."); return null; }
    } else {
      clienteNombre = nombre.trim();
      clienteTelefono = telefono.trim();
      clienteEmail = emailManual.trim() || undefined;
      if (!clienteNombre || !clienteTelefono) { setError("Completá los campos obligatorios."); return null; }
    }

    if (!marca.trim() || !modelo.trim()) { setError("Completá la marca y modelo del equipo."); return null; }

    return {
      cliente: { nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail },
      equipo: { tipo, marca: marca.trim(), modelo: modelo.trim() },
      fallas: fallas.filter((f) => f.trim()),
      presupuesto: presupuesto ? Number(presupuesto) : undefined,
      notaCliente: notaCliente.trim() || undefined,
      notaInterna: notaInterna.trim() || undefined,
      tipoAcceso: tipoAcceso || undefined,
      codigoAcceso: tipoAcceso && tipoAcceso !== "sin_acceso" ? codigoAcceso.trim() || undefined : undefined,
    };
  }

  async function persistReparacion(payload: NonNullable<ReturnType<typeof buildPayload>>) {
    if (!savedId) {
      // Create
      const res = await fetch("/api/reparaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear la reparación");
      }
      const data = await res.json();
      setSavedId(data._id);

      if (presupuestoId) {
        await fetch(`/api/presupuestos/${presupuestoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "convertido", reparacionId: data._id }),
        }).catch(() => {});
      }

      return data._id as string;
    } else {
      // Update
      const res = await fetch(`/api/reparaciones/${savedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al actualizar la reparación");
      }
      return savedId;
    }
  }

  function draftKey() {
    return presupuestoId ? `reparacion-draft-${presupuestoId}` : null;
  }

  // ── Guardar (stays on page) ───────────────────────────────────────────────
  async function handleSave() {
    setError("");
    if (!savedId) {
      // Sin reparación registrada: guardar borrador local únicamente
      const key = draftKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify({
          presupuesto, notaCliente, notaInterna,
          tipo, marca, modelo, fallas, marcaCustom, modeloCustom,
          tipoAcceso, codigoAcceso,
        }));
      }
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }
    // Reparación ya registrada: actualizar en el servidor
    const payload = buildPayload();
    if (!payload) return;
    setLoadingAction("save");
    try {
      await persistReparacion(payload);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingAction(null);
    }
  }

  // ── Registrar (saves and shows print modal) ──────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    setLoadingAction("register");
    try {
      const id = await persistReparacion(payload);
      const key = draftKey();
      if (key) localStorage.removeItem(key);
      setPrintModal({ id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoadingAction(null);
    }
  }

  const backHref = presupuestoId
    ? "/soporte-tecnico/admin/presupuestos"
    : "/soporte-tecnico/admin/reparaciones";

  const fallasFilled = fallas.filter((f) => f.trim());

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nueva reparación</h1>
          <p className="text-sm text-gray-500">Registrá el equipo del cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Datos del cliente ── */}
        <Section title="Datos del cliente">
          {lookupLoading && (
            <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando datos del cliente…
            </div>
          )}
          {!lookupDone && !lookupLoading && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); markChanged(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookupClient(); } }}
                  placeholder="Buscar cliente por email…"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={lookupClient}
                  disabled={!emailInput.trim()}
                  className="px-4 py-2.5 bg-(--tenant-primary) text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Ingresá el email del cliente para cargar sus datos, o{" "}
                <button type="button" className="text-(--tenant-primary) hover:underline font-medium" onClick={() => setLookupDone(true)}>
                  completá manualmente
                </button>.
              </p>
            </div>
          )}
          {lookupDone && registeredClient && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <button type="button" onClick={resetClientLookup} className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
                  Cambiar cliente
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nombre</p>
                  <p className="font-medium text-gray-800">{registeredClient.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="font-medium text-gray-800 truncate">{registeredClient.email}</p>
                </div>
                {registeredClient.phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                    <p className="font-medium text-gray-800">{registeredClient.phone}</p>
                  </div>
                )}
              </div>
              {!registeredClient.phone && (
                <>
                  <Field label="Teléfono *">
                    <input value={regPhone} onChange={(e) => { setRegPhone(e.target.value); markChanged(); }} placeholder="+54 11 1234-5678" required className={inputCls} />
                  </Field>
                  <p className="text-xs text-amber-600">Este cliente no tiene teléfono en su perfil. Ingresalo para continuar.</p>
                </>
              )}
            </div>
          )}
          {lookupDone && !registeredClient && (
            <>
              {emailInput && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <UserX className="w-4 h-4 shrink-0" />
                  <span>No encontramos una cuenta con ese email.</span>
                  <button type="button" onClick={resetClientLookup} className="ml-auto text-xs text-amber-700 hover:underline shrink-0">Buscar otro</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre *">
                  <input value={nombre} onChange={(e) => { setNombre(e.target.value); markChanged(); }} placeholder="Nombre completo" required className={inputCls} />
                </Field>
                <Field label="Teléfono *">
                  <input value={telefono} onChange={(e) => { setTelefono(e.target.value); markChanged(); }} placeholder="+54 11 1234-5678" required className={inputCls} />
                </Field>
              </div>
              <Field label="Email (vincula al cliente con su cuenta)">
                <input type="email" value={emailManual} onChange={(e) => { setEmailManual(e.target.value); markChanged(); }} placeholder="cliente@email.com" className={inputCls} />
              </Field>
            </>
          )}
        </Section>

        {/* ── Info card (from presupuesto, read-only) ── */}
        {showInfoCard && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipo y fallas</p>
              <button type="button" onClick={handleStartEditing} className="flex items-center gap-1.5 text-xs text-(--tenant-primary) font-medium hover:underline">
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Tipo</p>
                <p className="font-medium text-gray-800">{TIPO_LABEL[tipo]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Marca</p>
                <p className="font-medium text-gray-800">{marca}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Modelo</p>
                <p className="font-medium text-gray-800">{modelo}</p>
              </div>
            </div>
            {fallasFilled.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Fallas</p>
                <ul className="space-y-1">
                  {fallasFilled.map((f, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-300 mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Equipment + Fallas form (fresh or editing) ── */}
        {!showInfoCard && (
          <>
            <Section title="Equipo">
              <Field label="Tipo *">
                <div className="flex gap-2">
                  {(["celular", "laptop", "pc"] as DeviceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTipoChange(t)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                        tipo === t ? "bg-(--tenant-primary) text-white border-(--tenant-primary)" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {t === "pc" ? "PC" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Marca *">
                {catalogLoading ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-sm text-gray-400 border border-gray-200 rounded-xl bg-gray-50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Cargando marcas…
                  </div>
                ) : !marcaCustom && catalogBrands.length > 0 ? (
                  <select value={marca} onChange={(e) => handleMarcaSelect(e.target.value)} className={selectCls}>
                    <option value="">Seleccionar marca…</option>
                    {catalogBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                    <option value="__custom__">Otra marca…</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input value={marca} onChange={(e) => { setMarca(e.target.value); markChanged(); }} placeholder="Samsung, HP, Apple…" required className={inputCls} />
                    {catalogBrands.length > 0 && (
                      <button type="button" onClick={() => { setMarcaCustom(false); setMarca(""); setModelo(""); setModeloCustom(false); setFallas([""]); }} className="text-xs text-(--tenant-primary) hover:underline">
                        ← Elegir del catálogo
                      </button>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Modelo *">
                {!marcaCustom && catalogModels.length > 0 && !modeloCustom ? (
                  <select value={modelo} onChange={(e) => handleModeloSelect(e.target.value)} className={selectCls}>
                    <option value="">Seleccionar modelo…</option>
                    {catalogModels.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">Otro modelo…</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      value={modelo}
                      onChange={(e) => { setModelo(e.target.value); markChanged(); }}
                      placeholder="Galaxy A52, Pavilion 15…"
                      required
                      disabled={!marca.trim()}
                      className={inputCls}
                    />
                    {!marcaCustom && catalogModels.length > 0 && modeloCustom && (
                      <button type="button" onClick={() => { setModeloCustom(false); setModelo(""); setFallas([""]); }} className="text-xs text-(--tenant-primary) hover:underline">
                        ← Elegir del catálogo
                      </button>
                    )}
                    {marca === "" && <p className="text-xs text-gray-400">Seleccioná una marca primero.</p>}
                  </div>
                )}
              </Field>
            </Section>

            {/* ── Fallas ── */}
            <Section title="Fallas o servicios">
              {isChipMode ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {catalogRepairTypes.map((rt) => {
                      const selected = fallas.includes(rt);
                      return (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => toggleChip(rt)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            selected
                              ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-(--tenant-primary)"
                          }`}
                        >
                          {rt}
                        </button>
                      );
                    })}
                  </div>

                  {textFallaEntries.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {textFallaEntries.map(({ f, i }) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={f}
                            onChange={(e) => updateTextFalla(i, e.target.value)}
                            placeholder="Falla personalizada…"
                            className={`${inputCls} flex-1`}
                          />
                          <button type="button" onClick={() => removeTextFalla(i)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button type="button" onClick={addTextFalla} className="flex items-center gap-1.5 text-sm text-(--tenant-primary) font-medium hover:underline mt-1">
                    <Plus className="w-3.5 h-3.5" />
                    Agregar falla personalizada
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {fallas.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={f}
                          onChange={(e) => { setFallas((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v))); markChanged(); }}
                          placeholder={`Falla ${i + 1}…`}
                          className={`${inputCls} flex-1`}
                        />
                        {fallas.length > 1 && (
                          <button type="button" onClick={() => { setFallas((prev) => prev.filter((_, idx) => idx !== i)); markChanged(); }} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setFallas((f) => [...f, ""]); markChanged(); }} className="flex items-center gap-1.5 text-sm text-(--tenant-primary) font-medium hover:underline mt-1">
                    <Plus className="w-3.5 h-3.5" />
                    Agregar falla
                  </button>
                </>
              )}
            </Section>
          </>
        )}

        {/* ── Datos de acceso ── */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1">Datos de acceso</p>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Solo staff</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo de acceso</label>
            <div className="flex flex-wrap gap-2">
              {(tipo === "celular"
                ? [{ val: "pin", label: "PIN" }, { val: "patron", label: "Patrón" }, { val: "sin_acceso", label: "Sin acceso" }]
                : [{ val: "contrasena", label: "Contraseña" }, { val: "sin_acceso", label: "Sin acceso" }]
              ).map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setTipoAcceso(val as TipoAcceso); markChanged(); }}
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
                    onClick={() => { setCodigoAcceso(""); markChanged(); }}
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium hover:underline">
                    <Pencil className="w-3 h-3" />
                    Cambiar patrón
                  </button>
                </div>
              ) : (
                <PatternLock
                  onConfirm={(p) => { setCodigoAcceso(p); markChanged(); }}
                />
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
                  onChange={(e) => { setCodigoAcceso(e.target.value); markChanged(); }}
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

          {tipoAcceso === "sin_acceso" && (
            <p className="text-xs text-gray-400">No se requiere código de acceso para este equipo.</p>
          )}

          {!tipoAcceso && (
            <p className="text-xs text-gray-400">Seleccioná el tipo de acceso si el cliente proveyó uno.</p>
          )}
        </div>

        {/* ── Presupuesto y notas (siempre visibles) ── */}
        <Section title="Presupuesto y notas">
          <Field label="Presupuesto estimado (opcional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input type="number" value={presupuesto} onChange={(e) => { setPresupuesto(e.target.value); markChanged(); }} placeholder="0" min={0} className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Nota para el cliente (visible en el seguimiento)">
            <textarea value={notaCliente} onChange={(e) => { setNotaCliente(e.target.value); markChanged(); }} rows={2} placeholder="Ej: El equipo ya fue revisado, esperamos la pieza." className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Nota interna (solo admin)">
            <textarea value={notaInterna} onChange={(e) => { setNotaInterna(e.target.value); markChanged(); }} rows={2} placeholder="Notas técnicas internas…" className={`${inputCls} resize-none`} />
          </Field>
        </Section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Link
            href={backHref}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={loadingAction !== null || (!!presupuestoId && !hasChanges)}
            className={`px-5 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-40 ${
              saveSuccess
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-white border-(--tenant-primary) text-(--tenant-primary) hover:bg-blue-50"
            }`}
          >
            {loadingAction === "save" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              "¡Guardado!"
            ) : savedId ? (
              "Guardar cambios"
            ) : (
              "Guardar"
            )}
          </button>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="px-5 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-(--tenant-primary) hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-60"
          >
            {loadingAction === "register" && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar
          </button>
        </div>
      </form>
      {printModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5 text-(--tenant-primary)" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Reparación registrada</p>
                <p className="text-sm text-gray-500">¿Querés imprimir el ticket de recepción?</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => router.push(`/soporte-tecnico/admin/reparaciones/${printModal.id}`)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                No, gracias
              </button>
              <button
                onClick={() => {
                  window.open(
                    `/soporte-tecnico/admin/reparaciones/${printModal.id}/ticket`,
                    "_blank",
                  );
                  router.push(`/soporte-tecnico/admin/reparaciones/${printModal.id}`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-(--tenant-primary) rounded-xl hover:bg-blue-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      {children}
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
