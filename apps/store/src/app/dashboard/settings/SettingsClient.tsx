"use client";

import { useState } from "react";
import {
  Store, Mail, Phone, FileText, Truck, CheckCircle,
  AlertCircle, Instagram, Facebook, MessageCircle, User, Lock,
  LayoutGrid, Tag,
} from "lucide-react";
import Link from "next/link";

interface Settings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeDescription: string;
  shippingCost: number;
  freeShippingThreshold: number;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  homeFeaturedMode: "products" | "categories";
}

interface Props {
  initialSettings: Settings;
  adminName: string;
  adminEmail: string;
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-(--tenant-primary)" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function SettingsClient({ initialSettings, adminName, adminEmail }: Props) {
  const [data, setData] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ section: string; ok: boolean } | null>(null);

  const set = (field: keyof Settings, value: string | number) =>
    setData((d) => ({ ...d, [field]: value }));

  const save = async (section: string, payload: Partial<Settings>) => {
    setSaving(section);
    setFlash(null);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setFlash({ section, ok: res.ok });
    } catch {
      setFlash({ section, ok: false });
    } finally {
      setSaving(null);
      setTimeout(() => setFlash(null), 3000);
    }
  };

  const Flash = ({ section }: { section: string }) =>
    flash?.section === section ? (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
          flash.ok ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {flash.ok ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
        {flash.ok ? "Guardado" : "Error al guardar"}
      </span>
    ) : null;

  const SaveBtn = ({
    section,
    payload,
  }: {
    section: string;
    payload: Partial<Settings>;
  }) => (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Flash section={section} />
      <button
        onClick={() => save(section, payload)}
        disabled={saving === section}
        className="bg-(--tenant-primary) text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
      >
        {saving === section ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Store info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle
          icon={Store}
          title="Información de la tienda"
          description="Datos generales visibles en emails y la tienda"
        />
        <div className="space-y-4">
          <Field label="Nombre de la tienda *">
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={data.storeName}
                onChange={(e) => set("storeName", e.target.value)}
                placeholder="Compumobile"
                className={`${INPUT} pl-9`}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email de contacto">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="email"
                  value={data.storeEmail}
                  onChange={(e) => set("storeEmail", e.target.value)}
                  placeholder="info@tienda.com"
                  className={`${INPUT} pl-9`}
                />
              </div>
            </Field>
            <Field label="Teléfono">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="tel"
                  value={data.storePhone}
                  onChange={(e) => set("storePhone", e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className={`${INPUT} pl-9`}
                />
              </div>
            </Field>
          </div>
          <Field label="Descripción breve">
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-300" />
              <textarea
                value={data.storeDescription}
                onChange={(e) => set("storeDescription", e.target.value)}
                placeholder="Descripción corta de la tienda..."
                rows={3}
                className={`${INPUT} pl-9 resize-none`}
              />
            </div>
          </Field>
        </div>
        <SaveBtn
          section="store"
          payload={{
            storeName: data.storeName,
            storeEmail: data.storeEmail,
            storePhone: data.storePhone,
            storeDescription: data.storeDescription,
          }}
        />
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle
          icon={Truck}
          title="Configuración de envío"
          description="Costos base y umbral de envío gratis"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Costo de envío ($)"
            hint="0 para envío gratuito siempre"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                $
              </span>
              <input
                type="number"
                min={0}
                value={data.shippingCost}
                onChange={(e) => set("shippingCost", Number(e.target.value))}
                className={`${INPUT} pl-7`}
              />
            </div>
          </Field>
          <Field
            label="Envío gratis desde ($)"
            hint="0 para desactivar"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                $
              </span>
              <input
                type="number"
                min={0}
                value={data.freeShippingThreshold}
                onChange={(e) =>
                  set("freeShippingThreshold", Number(e.target.value))
                }
                className={`${INPUT} pl-7`}
              />
            </div>
          </Field>
        </div>
        <SaveBtn
          section="shipping"
          payload={{
            shippingCost: data.shippingCost,
            freeShippingThreshold: data.freeShippingThreshold,
          }}
        />
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle
          icon={MessageCircle}
          title="Redes sociales"
          description="Links de contacto y redes de la tienda"
        />
        <div className="space-y-4">
          <Field label="Instagram">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={data.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/tutienda"
                className={`${INPUT} pl-9`}
              />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={data.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/tutienda"
                className={`${INPUT} pl-9`}
              />
            </div>
          </Field>
          <Field label="WhatsApp" hint="Solo número con código de país, sin espacios ni guiones">
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={data.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="5491112345678"
                className={`${INPUT} pl-9`}
              />
            </div>
          </Field>
        </div>
        <SaveBtn
          section="social"
          payload={{
            instagramUrl: data.instagramUrl,
            facebookUrl: data.facebookUrl,
            whatsappNumber: data.whatsappNumber,
          }}
        />
      </div>

      {/* Home featured mode */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle
          icon={LayoutGrid}
          title="Sección de destacados — Home"
          description="Elegí cómo mostrar los productos destacados en la página de inicio"
        />
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                value: "products",
                icon: LayoutGrid,
                label: "Productos individuales",
                description: "Muestra hasta 8 productos marcados como destacados.",
              },
              {
                value: "categories",
                icon: Tag,
                label: "Por categoría",
                description: "Muestra banners de categorías con sus 3 productos principales.",
              },
            ] as const
          ).map(({ value, icon: Icon, label, description }) => {
            const active = data.homeFeaturedMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set("homeFeaturedMode", value)}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-(--tenant-primary) bg-blue-50"
                    : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-(--tenant-primary)" : "bg-gray-100"}`}>
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-(--tenant-primary)" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>
                </div>
                {active && (
                  <span className="text-[10px] font-bold text-(--tenant-primary) uppercase tracking-wider">
                    Activo
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <SaveBtn
          section="featuredMode"
          payload={{ homeFeaturedMode: data.homeFeaturedMode }}
        />
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle
          icon={User}
          title="Cuenta de administrador"
          description="Información de tu cuenta"
        />
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-(--tenant-primary) flex items-center justify-center text-white text-xs font-bold shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-400">{adminEmail}</p>
            </div>
          </div>
          <Link
            href="/account/change-password"
            className="flex items-center gap-2 text-sm font-semibold text-(--tenant-primary) hover:underline px-1"
          >
            <Lock className="w-4 h-4" />
            Cambiar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
