"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, BookOpen } from "lucide-react";

type DeviceType = "celular" | "laptop" | "pc";

interface RepairItem {
  type: string;
  price: number;
}

interface CatalogEntry {
  _id: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  active: boolean;
  repairs: RepairItem[];
}

const DEVICE_LABEL: Record<DeviceType, string> = {
  celular: "📱 Celular",
  laptop: "💻 Laptop",
  pc: "🖥️ PC",
};

const EMPTY_FORM: Omit<CatalogEntry, "_id"> = {
  deviceType: "celular",
  brand: "",
  model: "",
  active: true,
  repairs: [],
};

export default function CatalogoClient({ items: initial }: { items: CatalogEntry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<DeviceType | "all">("all");
  const [modal, setModal] = useState<{ open: boolean; entry: Omit<CatalogEntry, "_id"> & { _id?: string } }>({
    open: false,
    entry: EMPTY_FORM,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visible = filter === "all" ? items : items.filter((i) => i.deviceType === filter);

  function openNew() {
    setError("");
    setModal({ open: true, entry: { ...EMPTY_FORM, repairs: [] } });
  }

  function openEdit(entry: CatalogEntry) {
    setError("");
    setModal({ open: true, entry: { ...entry, repairs: entry.repairs.map((r) => ({ ...r })) } });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }

  function setField<K extends keyof typeof modal.entry>(key: K, value: typeof modal.entry[K]) {
    setModal((m) => ({ ...m, entry: { ...m.entry, [key]: value } }));
  }

  function addRepair() {
    setModal((m) => ({
      ...m,
      entry: { ...m.entry, repairs: [...m.entry.repairs, { type: "", price: 0 }] },
    }));
  }

  function updateRepair(idx: number, field: "type" | "price", value: string) {
    setModal((m) => {
      const repairs = m.entry.repairs.map((r, i) =>
        i === idx ? { ...r, [field]: field === "price" ? Number(value) || 0 : value } : r
      );
      return { ...m, entry: { ...m.entry, repairs } };
    });
  }

  function removeRepair(idx: number) {
    setModal((m) => ({
      ...m,
      entry: { ...m.entry, repairs: m.entry.repairs.filter((_, i) => i !== idx) },
    }));
  }

  async function save() {
    const { _id, ...body } = modal.entry;
    if (!body.brand.trim() || !body.model.trim()) {
      setError("Marca y modelo son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = _id ? `/api/repair-catalog/${_id}` : "/api/repair-catalog";
      const method = _id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }

      if (_id) {
        setItems((prev) => prev.map((i) => (i._id === _id ? { ...data, _id } : i)));
      } else {
        setItems((prev) => [...prev, { ...data, _id: data._id }]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("¿Eliminar esta entrada del catálogo?")) return;
    setDeleting(id);
    await fetch(`/api/repair-catalog/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i._id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de precios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} modelos cargados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo modelo
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "celular", "laptop", "pc"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f
                ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {f === "all" ? "Todos" : DEVICE_LABEL[f]}
            <span className="ml-1.5 opacity-70">
              ({f === "all" ? items.length : items.filter((i) => i.deviceType === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay entradas en el catálogo</p>
          <p className="text-sm text-gray-400 mt-1">Agregá modelos con sus precios de reparación.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca / Modelo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Reparaciones</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {DEVICE_LABEL[entry.deviceType]}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{entry.brand}</p>
                    <p className="text-xs text-gray-500">{entry.model}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {entry.repairs.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Sin precios</span>
                      ) : (
                        entry.repairs.slice(0, 3).map((r, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {r.type}
                            {r.price > 0 && <span className="font-semibold">· ${r.price.toLocaleString("es-AR")}</span>}
                          </span>
                        ))
                      )}
                      {entry.repairs.length > 3 && (
                        <span className="text-xs text-gray-400">+{entry.repairs.length - 3} más</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      entry.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {entry.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {entry.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-gray-400 hover:text-(--tenant-primary) transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry._id)}
                        disabled={deleting === entry._id}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {modal.entry._id ? "Editar modelo" : "Nuevo modelo"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}

              {/* Device type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de equipo</label>
                <div className="flex gap-2">
                  {(["celular", "laptop", "pc"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setField("deviceType", d)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        modal.entry.deviceType === d
                          ? "bg-(--tenant-primary) text-white border-(--tenant-primary)"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {DEVICE_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Marca</label>
                  <input
                    value={modal.entry.brand}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="Ej: Samsung"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Modelo</label>
                  <input
                    value={modal.entry.model}
                    onChange={(e) => setField("model", e.target.value)}
                    placeholder="Ej: Galaxy A54"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary)"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setField("active", !modal.entry.active)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    modal.entry.active ? "bg-(--tenant-primary)" : "bg-gray-300"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    modal.entry.active ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {modal.entry.active ? "Activo (visible en el chatbot)" : "Inactivo (oculto)"}
                </span>
              </label>

              {/* Repairs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">Reparaciones y precios</label>
                  <button
                    type="button"
                    onClick={addRepair}
                    className="flex items-center gap-1 text-xs font-semibold text-(--tenant-primary) hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
                {modal.entry.repairs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sin reparaciones. Hacé clic en "Agregar".</p>
                ) : (
                  <div className="space-y-2">
                    {modal.entry.repairs.map((r, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={r.type}
                          onChange={(e) => updateRepair(i, "type", e.target.value)}
                          placeholder="Tipo de reparación"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary)"
                        />
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min={0}
                            value={r.price || ""}
                            onChange={(e) => updateRepair(i, "price", e.target.value)}
                            placeholder="0 = consultar"
                            className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRepair(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">Precio 0 = "a consultar" en el chatbot</p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-(--tenant-primary) text-white rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
