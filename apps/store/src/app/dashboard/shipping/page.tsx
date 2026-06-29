"use client";

import { useEffect, useState } from "react";
import { Truck, Zap, Save, RotateCcw, MapPin, Plus, X, CheckCircle, AlertCircle } from "lucide-react";

interface ZipRange {
  min: number;
  max: number;
}

interface Zone {
  id: string;
  name: string;
  localities: string[];
  zipRanges: ZipRange[];
  flex: number;
  standard: number;
}

export default function ShippingSettingsPage() {
  const [zones, setZones]                   = useState<Zone[]>([]);
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [savingToggle, setSavingToggle]     = useState(false);
  const [saved, setSaved]                   = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/shipping/zones").then((r) => r.json()),
      fetch("/api/dashboard/settings").then((r) => r.json()),
    ])
      .then(([zonesData, settingsData]) => {
        if (Array.isArray(zonesData)) {
          setZones(zonesData.map((z: Zone) => ({ ...z, zipRanges: z.zipRanges ?? [] })));
        }
        if (typeof settingsData?.shippingEnabled === "boolean") {
          setShippingEnabled(settingsData.shippingEnabled);
        }
      })
      .catch(() => setError("No se pudieron cargar los datos"))
      .finally(() => setLoading(false));
  }, []);

  const toggleShipping = async () => {
    const next = !shippingEnabled;
    setShippingEnabled(next);
    setSavingToggle(true);
    try {
      await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingEnabled: next }),
      });
    } catch {
      setShippingEnabled(!next);
    } finally {
      setSavingToggle(false);
    }
  };

  const updateZone = (id: string, field: "flex" | "standard", value: number) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
    setSaved(false);
  };

  const addRange = (zoneId: string) => {
    setZones((prev) =>
      prev.map((z) => z.id === zoneId ? { ...z, zipRanges: [...z.zipRanges, { min: 0, max: 0 }] } : z)
    );
    setSaved(false);
  };

  const updateRange = (zoneId: string, idx: number, field: "min" | "max", value: number) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, zipRanges: z.zipRanges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)) }
          : z
      )
    );
    setSaved(false);
  };

  const removeRange = (zoneId: string, idx: number) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId ? { ...z, zipRanges: z.zipRanges.filter((_, i) => i !== idx) } : z
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/shipping/zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error al guardar las tarifas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Envíos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Activá o desactivá los envíos y ajustá tarifas por zona del AMBA.
        </p>
      </div>

      {/* ── Toggle de envíos ── */}
      <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-colors ${
        shippingEnabled ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            shippingEnabled ? "bg-green-100" : "bg-red-100"
          }`}>
            <Truck className={`w-4 h-4 ${shippingEnabled ? "text-green-600" : "text-red-500"}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${shippingEnabled ? "text-green-800" : "text-red-800"}`}>
              {shippingEnabled ? "Envíos activos" : "Envíos desactivados"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
              {shippingEnabled
                ? "Los clientes ven opciones y precios de envío en los productos."
                : "Se muestra \"Acordar con el vendedor\". Las tarifas y zonas no están disponibles."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleShipping}
          disabled={savingToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
            shippingEnabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              shippingEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* ── Zonas y tarifas — deshabilitadas si envíos están apagados ── */}
      <div className={`space-y-6 transition-opacity duration-200 ${!shippingEnabled ? "opacity-40 pointer-events-none select-none" : ""}`}>

        {!shippingEnabled && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Activá los envíos para poder editar las tarifas y zonas.
            </p>
          </div>
        )}

        {zones.map((zone) => (
          <div key={zone.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="w-8 h-8 bg-(--tenant-primary) rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{zone.name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{zone.localities.join(" · ")}</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-2">
                    <Zap className="w-3.5 h-3.5" /> Envío flex
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      value={zone.flex}
                      min={0}
                      onChange={(e) => updateZone(zone.id, "flex", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-2">
                    <Truck className="w-3.5 h-3.5" /> Envío estándar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      value={zone.standard}
                      min={0}
                      onChange={(e) => updateZone(zone.id, "standard", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">Rangos de código postal</p>
                  <button
                    type="button"
                    onClick={() => addRange(zone.id)}
                    className="flex items-center gap-1 text-xs text-(--tenant-primary) font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar rango
                  </button>
                </div>

                {zone.zipRanges.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Sin rangos configurados — se usará solo el nombre de ciudad.
                  </p>
                )}

                <div className="space-y-2">
                  {zone.zipRanges.map((range, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <input
                          type="number"
                          value={range.min}
                          min={0}
                          onChange={(e) => updateRange(zone.id, idx, "min", Number(e.target.value))}
                          className="w-20 text-sm font-mono text-gray-800 bg-transparent focus:outline-none"
                          placeholder="desde"
                        />
                        <span className="text-gray-400 text-sm select-none">–</span>
                        <input
                          type="number"
                          value={range.max}
                          min={0}
                          onChange={(e) => updateRange(zone.id, idx, "max", Number(e.target.value))}
                          className="w-20 text-sm font-mono text-gray-800 bg-transparent focus:outline-none"
                          placeholder="hasta"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRange(zone.id, idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Interior del país</p>
          <p className="text-xs text-gray-500">
            Los envíos al interior se gestionan por Correo Argentino, Andreani u OCA.
            El precio se coordina directamente con el cliente vía WhatsApp.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !shippingEnabled}
            className="flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar tarifas"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
              <CheckCircle className="w-4 h-4" /> Tarifas guardadas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
