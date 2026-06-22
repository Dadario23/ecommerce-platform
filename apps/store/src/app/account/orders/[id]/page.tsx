"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle,
  Home, CreditCard, MapPin, CalendarDays, Ban, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  payment: { method: string; status: string; transactionId?: string };
  trackingNumber?: string;
  notes?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:    { label: "Pendiente",   icon: Clock,        pill: "bg-yellow-100 text-yellow-700", step: 0 },
  confirmed:  { label: "Confirmado",  icon: CheckCircle,  pill: "bg-blue-100 text-blue-700",    step: 1 },
  processing: { label: "Procesando",  icon: Package,      pill: "bg-blue-100 text-blue-700",    step: 1 },
  shipped:    { label: "En camino",   icon: Truck,        pill: "bg-purple-100 text-purple-700", step: 2 },
  delivered:  { label: "Entregado",   icon: CheckCircle,  pill: "bg-green-100 text-green-700",  step: 3 },
  cancelled:  { label: "Cancelado",   icon: XCircle,      pill: "bg-red-100 text-red-700",      step: -1 },
};

const TIMELINE_STEPS = [
  { icon: CheckCircle, label: "Confirmado" },
  { icon: Package,     label: "Preparando" },
  { icon: Truck,       label: "En camino"  },
  { icon: Home,        label: "Entregado"  },
];

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  cash:        "Contra entrega",
  transfer:    "Transferencia bancaria",
};

const CANCELLABLE   = new Set(["pending", "confirmed"]);
const RESCHEDULABLE = new Set(["pending", "confirmed", "processing"]);

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function addBusinessDays(date: Date, n: number): Date {
  let count = 0;
  const d = new Date(date);
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d;
}

function formatDateLong(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

function getSelectableDates(from: Date): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i + 1);
    return d;
  }).filter((d) => d.getDay() !== 0 && d.getDay() !== 6);
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Actions state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState("any");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const today = new Date();
  // Fechas disponibles para reprogramar: a partir del próximo día hábil, 10 opciones
  const firstRescheduleDate = addBusinessDays(today, 1);
  const rescheduleableDates = getSelectableDates(today).slice(0, 10);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : "error");
        return r.json();
      })
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function cancelOrder() {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? "No se pudo cancelar la orden");
        return;
      }
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : null);
      setShowCancelConfirm(false);
    } catch {
      setActionError("Error al cancelar la orden");
    } finally {
      setActionLoading(false);
    }
  }

  async function rescheduleOrder() {
    if (selectedDate === "any") { setShowReschedule(false); return; }
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", deliveryDate: selectedDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? "No se pudo reprogramar el envío");
        return;
      }
      setOrder((prev) =>
        prev
          ? { ...prev, notes: `Preferencia de entrega: ${selectedDate}` }
          : null
      );
      setShowReschedule(false);
    } catch {
      setActionError("Error al reprogramar el envío");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-32" />
        <div className="h-7 bg-gray-100 rounded w-56 mt-4" />
        <div className="h-32 bg-gray-100 rounded-xl mt-4" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Package className="w-6 h-6 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-700 mb-1">
          {error === "not_found" ? "Pedido no encontrado" : "No se pudo cargar el pedido"}
        </p>
        <p className="text-sm text-gray-400 mb-5">
          {error === "not_found"
            ? "El pedido no existe o no tenés acceso"
            : "Intentá de nuevo en unos instantes"}
        </p>
        <Link
          href="/account/orders"
          className="text-sm text-[#1E3A8A] font-semibold hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const isCancelled = order.status === "cancelled";
  const currentStep = cfg.step;
  const addr = order.shippingAddress;

  const canCancel   = CANCELLABLE.has(order.status);
  const canReschedule = RESCHEDULABLE.has(order.status);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E3A8A] font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis compras
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-mono">
            #{order.orderNumber}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("es-AR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.pill}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </span>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-4 h-px bg-gray-200 z-0" />
            {TIMELINE_STEPS.map((step, i) => {
              const done   = i <= currentStep;
              const active = i === currentStep;
              const Icon   = step.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    done ? "bg-[#1E3A8A] border-[#1E3A8A]" : "bg-white border-gray-200"
                  } ${active ? "ring-4 ring-blue-100" : ""}`}>
                    <Icon className={`w-3.5 h-3.5 ${done ? "text-white" : "text-gray-300"}`} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${done ? "text-[#1E3A8A]" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.trackingNumber && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-blue-700">
            N° de seguimiento:{" "}
            <span className="font-mono font-semibold">{order.trackingNumber}</span>
          </span>
        </div>
      )}

      {/* Items */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-50">
          Productos ({order.items.length})
        </p>
        <ul className="divide-y divide-gray-50">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                <Image
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.quantity} × ${item.price.toLocaleString("es-AR")}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 bg-gray-50">
          {order.discount > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${order.subtotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Descuento</span>
                <span>−${order.discount.toLocaleString("es-AR")}</span>
              </div>
            </>
          )}
          {order.shipping > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Envío</span>
              <span>${order.shipping.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span className="text-base">${order.total.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Dirección de envío
            </p>
          </div>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p className="font-medium">{addr.firstName} {addr.lastName}</p>
            <p>{addr.street}</p>
            <p>{addr.city}, {addr.state} {addr.zipCode}</p>
            <p>{addr.country}</p>
            {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Pago
            </p>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium">
              {PAYMENT_LABELS[order.payment.method] ?? order.payment.method}
            </p>
            <p className={`text-xs font-semibold ${
              order.payment.status === "completed" ? "text-green-600"
                : order.payment.status === "pending" ? "text-yellow-600"
                : "text-gray-500"
            }`}>
              {order.payment.status === "completed" ? "Pago recibido"
                : order.payment.status === "pending" ? "Pendiente de pago"
                : order.payment.status}
            </p>
            {order.payment.transactionId && (
              <p className="text-xs text-gray-400 font-mono break-all">
                {order.payment.transactionId}
              </p>
            )}
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">Nota: </span>{order.notes}
        </div>
      )}

      {/* ── Acciones del usuario ── */}
      {(canCancel || canReschedule) && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-50">
            Gestionar pedido
          </p>
          <div className="p-4 space-y-3">

            {/* Reprogramar envío */}
            {canReschedule && !showReschedule && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => { setShowReschedule(true); setActionError(""); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#1E3A8A] hover:bg-blue-50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Reprogramar el envío
                  </p>
                  <p className="text-xs text-gray-500">
                    Elegí un día de entrega diferente
                  </p>
                </div>
              </button>
            )}

            {/* Selector de fecha inline */}
            {showReschedule && (
              <div className="rounded-xl border border-[#1E3A8A]/20 bg-blue-50/50 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#1E3A8A]" />
                  Elegí el nuevo día de entrega
                </p>
                <p className="text-xs text-gray-500">
                  Primer día disponible: <span className="font-semibold text-gray-700">{formatDateLong(firstRescheduleDate)}</span>.
                  Podés elegir hasta 10 días hábiles.
                </p>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {rescheduleableDates.map((date) => {
                    const str = toDateStr(date);
                    const isSelected = selectedDate === str;
                    const isFirst = toDateStr(date) === toDateStr(firstRescheduleDate);
                    return (
                      <button
                        key={str}
                        type="button"
                        onClick={() => setSelectedDate(str)}
                        className={`flex flex-col items-center shrink-0 w-14 py-2.5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-[#1E3A8A] bg-[#1E3A8A]"
                            : "border-gray-200 bg-white hover:border-[#1E3A8A]/50 hover:bg-blue-50"
                        }`}
                      >
                        <span className={`text-[10px] font-medium ${isSelected ? "text-blue-200" : "text-gray-500"}`}>
                          {DAYS_ES[date.getDay()]}
                        </span>
                        <span className={`text-base font-bold ${isSelected ? "text-white" : "text-gray-800"}`}>
                          {date.getDate()}
                        </span>
                        <span className={`text-[10px] ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                          {MONTHS_ES[date.getMonth()]}
                        </span>
                        {isFirst && !isSelected && (
                          <span className="text-[9px] text-[#1E3A8A] font-bold mt-0.5">antes</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDate !== "any" && (
                  <p className="text-xs text-[#1E3A8A] font-semibold">
                    ✓ Tu envío llegará el {formatDateLong(new Date(selectedDate + "T00:00:00"))}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={rescheduleOrder}
                    disabled={actionLoading || selectedDate === "any"}
                    className="flex-1 bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? "Guardando..." : "Confirmar nueva fecha"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReschedule(false); setSelectedDate("any"); setActionError(""); }}
                    className="px-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Cancelar compra */}
            {canCancel && !showReschedule && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => { setShowCancelConfirm(true); setActionError(""); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Ban className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Cancelar compra
                  </p>
                  <p className="text-xs text-gray-500">
                    Se cancelará el pedido y se restaurará el stock
                  </p>
                </div>
              </button>
            )}

            {/* Confirmación de cancelación */}
            {showCancelConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      ¿Cancelar este pedido?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Esta acción no se puede deshacer. Si pagaste con Mercado Pago, el
                      reembolso se gestiona por separado.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelOrder}
                    disabled={actionLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? "Cancelando..." : "Sí, cancelar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCancelConfirm(false); setActionError(""); }}
                    className="px-4 text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-xs text-red-500 px-1">{actionError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
