"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Check, Phone } from "lucide-react";

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary) placeholder:text-gray-400";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.name ?? "");
        setPhone(d.phone ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error();
      await update({ name: name.trim() });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } catch {
      setError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Mi perfil</h2>
        <p className="text-sm text-gray-500 mt-1">Administrá tu información personal.</p>
      </div>

      {/* WhatsApp suggestion */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Agregá tu WhatsApp</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Si dejás un equipo en reparación, nuestros técnicos podrán avisarte los cambios
            de estado directamente por WhatsApp, con un solo clic desde el taller.
          </p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            value={session?.user?.email ?? ""}
            disabled
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Teléfono / WhatsApp
            <span className="text-[#25D366] text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              Recomendado
            </span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 1150610043"
            type="tel"
            maxLength={30}
            className={inputCls}
          />
          <p className="text-xs text-gray-400">
            Sin el 0 ni el 15, con código de área. Ej: 1150610043 (Buenos Aires)
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {ok ? (
            <>
              <Check className="w-4 h-4" /> Guardado
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </form>
    </div>
  );
}
