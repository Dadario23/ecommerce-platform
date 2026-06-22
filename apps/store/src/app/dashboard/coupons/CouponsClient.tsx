"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, Tag, Percent, DollarSign, Calendar,
  ShoppingCart, Users, AlertCircle,
} from "lucide-react";
import { ConfirmModal } from "@/components/dashboard/shared/ConfirmModal";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

const EMPTY_FORM = {
  code: "", type: "percentage" as "percentage" | "fixed",
  value: "", minOrder: "", maxUses: "", expiresAt: "",
};

function usageColor(used: number, max?: number) {
  if (!max) return "";
  const pct = used / max;
  if (pct >= 1) return "bg-red-100 text-red-700";
  if (pct >= 0.8) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => { setForm(EMPTY_FORM); setFormError(""); };

  const handleCreate = async () => {
    if (!form.code || !form.value) {
      setFormError("El código y el valor son requeridos");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/dashboard/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minOrder: form.minOrder ? Number(form.minOrder) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Error al crear"); return; }
      setCoupons((prev) => [{ ...data, id: data._id }, ...prev]);
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    await fetch(`/api/dashboard/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const deleteCoupon = async (id: string) => {
    await fetch(`/api/dashboard/coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const now = new Date();

  return (
    <>
      <div className="space-y-5 max-w-5xl">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total cupones",
              value: coupons.length,
              icon: <Tag className="w-5 h-5 text-blue-600" />,
              bg: "bg-blue-50",
            },
            {
              label: "Activos",
              value: coupons.filter((c) => c.isActive).length,
              icon: <Percent className="w-5 h-5 text-emerald-600" />,
              bg: "bg-emerald-50",
            },
            {
              label: "Usos totales",
              value: coupons.reduce((acc, c) => acc + c.usedCount, 0),
              icon: <Users className="w-5 h-5 text-violet-600" />,
              bg: "bg-violet-50",
            },
            {
              label: "Vencidos",
              value: coupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < now).length,
              icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
              bg: "bg-orange-50",
            },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                {icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
              <p className="text-xs font-medium text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Main table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">
              {coupons.length} {coupons.length === 1 ? "cupón" : "cupones"}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-[#1E3A8A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo cupón
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Sin cupones</p>
              <p className="text-sm text-gray-400 mb-5">Creá el primer cupón de descuento</p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo cupón
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr_0.8fr_auto_auto] gap-4 px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                <span>Código</span>
                <span>Tipo</span>
                <span>Valor</span>
                <span>Min. pedido</span>
                <span>Usos</span>
                <span>Vence</span>
                <span>Activo</span>
                <span />
              </div>

              <div className="divide-y divide-gray-50">
                {coupons.map((c) => {
                  const expired = c.expiresAt && new Date(c.expiresAt) < now;
                  const exhausted = c.maxUses != null && c.usedCount >= c.maxUses;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col md:grid md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr_0.8fr_auto_auto] md:items-center gap-2 md:gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      {/* Code */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                          {c.code}
                        </span>
                        {(expired || exhausted) && (
                          <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                            {expired ? "Vencido" : "Agotado"}
                          </span>
                        )}
                      </div>

                      {/* Type */}
                      <span className={`w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        c.type === "percentage"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {c.type === "percentage" ? "%" : "$"}
                      </span>

                      {/* Value */}
                      <p className="text-sm font-semibold text-gray-900">
                        {c.type === "percentage"
                          ? `${c.value}%`
                          : `$${c.value.toLocaleString("es-AR")}`}
                      </p>

                      {/* Min order */}
                      <p className="text-sm text-gray-500">
                        {c.minOrder > 0 ? `$${c.minOrder.toLocaleString("es-AR")}` : "—"}
                      </p>

                      {/* Uses */}
                      <span className={`w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        c.maxUses != null ? usageColor(c.usedCount, c.maxUses) : "bg-gray-100 text-gray-600"
                      }`}>
                        {c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : " usos"}
                      </span>

                      {/* Expires */}
                      <p className={`text-xs ${expired ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString("es-AR")
                          : "Sin venc."}
                      </p>

                      {/* Toggle */}
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => toggleActive(c)}
                      />

                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create coupon dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo cupón</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            {/* Code */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Código *
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="VERANO20"
                className="font-mono uppercase rounded-xl"
              />
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipo *</Label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "percentage" }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                      form.type === "percentage"
                        ? "bg-[#1E3A8A] text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Porcentaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "fixed" }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-l border-gray-200 transition-colors ${
                      form.type === "fixed"
                        ? "bg-[#1E3A8A] text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Monto fijo
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Valor * {form.type === "percentage" ? "(%)" : "($)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "percentage" ? "20" : "5000"}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Min order + Max uses */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  <span className="inline-flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" /> Pedido mínimo ($)
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                  placeholder="Opcional"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" /> Máx. usos
                  </span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Ilimitado"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Expiration */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fecha de vencimiento
                </span>
              </Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-500 font-medium">{formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-[#1E3A8A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Crear cupón"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteCoupon(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        title="Eliminar cupón"
        description="¿Estás seguro? El cupón se eliminará permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}
