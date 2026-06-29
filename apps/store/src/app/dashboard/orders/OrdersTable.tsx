"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, X, ShoppingBag, MapPin, CreditCard, Printer } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  pending:    { label: "Pendiente",   pill: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Confirmada",  pill: "bg-blue-100 text-blue-700" },
  processing: { label: "Procesando",  pill: "bg-violet-100 text-violet-700" },
  shipped:    { label: "Enviada",     pill: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "Entregada",   pill: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelada",   pill: "bg-red-100 text-red-700" },
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  cash: "Contra entrega",
};

const ALL_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

interface OrderItem { name: string; quantity: number; price: number; }
interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export default function OrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        q === "" ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, status } : prev);
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">
            {filtered.length} {filtered.length === 1 ? "orden" : "órdenes"}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar orden o cliente..."
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-52 placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-gray-700"
            >
              <option value="all">Todos</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {orders.length === 0 ? "No hay órdenes todavía" : "Sin resultados para ese filtro"}
          </div>
        ) : (
          <>
            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[1.2fr_1.8fr_1fr_1fr_1.2fr_0.8fr] gap-4 px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
              <span>Orden</span>
              <span>Cliente</span>
              <span>Fecha</span>
              <span>Pago</span>
              <span>Estado</span>
              <span className="text-right">Total</span>
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                return (
                  <div
                    key={order.id}
                    className="flex flex-col md:grid md:grid-cols-[1.2fr_1.8fr_1fr_1fr_1.2fr_0.8fr] md:items-center gap-2 md:gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm font-semibold text-(--tenant-primary) font-mono hover:underline text-left"
                    >
                      #{order.orderNumber}
                    </button>
                    <p className="text-sm text-gray-600 truncate">{order.customerEmail}</p>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </p>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </p>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 w-fit ${cfg.pill}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-gray-700 font-normal">
                          {STATUS_CONFIG[s].label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm font-bold text-gray-900 md:text-right">
                      ${order.total.toLocaleString("es-AR")}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">
              #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              {/* Items */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Productos ({selectedOrder.items.length})
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5">
                      <span className="text-gray-700">{item.quantity}× {item.name}</span>
                      <span className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2.5 font-bold text-gray-900">
                    <span>Total</span>
                    <span>${selectedOrder.total.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>

              {/* Address + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Envío
                    </p>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {selectedOrder.shippingAddress.firstName}{" "}
                    {selectedOrder.shippingAddress.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedOrder.shippingAddress.street}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Pago
                    </p>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {PAYMENT_LABELS[selectedOrder.paymentMethod] ?? selectedOrder.paymentMethod}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${
                    selectedOrder.paymentStatus === "completed"
                      ? "text-green-600"
                      : selectedOrder.paymentStatus === "pending"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}>
                    {selectedOrder.paymentStatus === "completed"
                      ? "Pago recibido"
                      : selectedOrder.paymentStatus === "pending"
                      ? "Pendiente"
                      : selectedOrder.paymentStatus}
                  </p>
                </div>
              </div>

              {/* Status change */}
              <div className="flex items-center gap-3 pt-1">
                <p className="text-xs font-medium text-gray-500 shrink-0">Cambiar estado:</p>
                <select
                  value={selectedOrder.status}
                  disabled={updating === selectedOrder.id}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 disabled:opacity-60 bg-white"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Print label */}
              <a
                href={`/dashboard/orders/${selectedOrder.id}/label`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir etiqueta
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
