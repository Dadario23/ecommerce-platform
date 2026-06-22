"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock, Truck, CheckCircle, XCircle, Package,
  ArrowRight, ChevronRight, ShoppingBag,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
  payment: { method: string; status: string };
}

const STATUS_CONFIG: Record<
  Order["status"],
  { label: string; description: string; icon: React.ElementType; pill: string; dot: string }
> = {
  pending:    { label: "Pendiente",  description: "Tu compra está siendo procesada",  icon: Clock,        pill: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  confirmed:  { label: "Confirmado", description: "Tu compra fue confirmada",         icon: CheckCircle,  pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   },
  processing: { label: "Preparando", description: "Estamos preparando tu pedido",     icon: Package,      pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   },
  shipped:    { label: "En camino",  description: "Tu pedido está en camino",         icon: Truck,        pill: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  delivered:  { label: "Entregado",  description: "Tu pedido fue entregado",          icon: CheckCircle,  pill: "bg-green-100 text-green-700",   dot: "bg-green-500"  },
  cancelled:  { label: "Cancelado",  description: "Tu compra fue cancelada",          icon: XCircle,      pill: "bg-red-100 text-red-700",       dot: "bg-red-400"    },
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  cash:        "Contra entrega",
  transfer:    "Transferencia bancaria",
};

function getPeriodLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 30) return "Recientes";
  if (diffDays <= 90) return "Últimos 3 meses";
  return d.getFullYear().toString();
}

function groupOrders(orders: Order[]): [string, Order[]][] {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const period = getPeriodLabel(order.createdAt);
    if (!map.has(period)) map.set(period, []);
    map.get(period)!.push(order);
  }
  return Array.from(map.entries());
}

function buildProductLabel(items: OrderItem[]): string {
  if (items.length === 0) return "Sin productos";
  const first = items[0];
  if (items.length === 1)
    return first.quantity > 1 ? `${first.name} (×${first.quantity})` : first.name;
  const rest = items.length - 1;
  return `${first.name} y ${rest} producto${rest > 1 ? "s" : ""} más`;
}

function OrderCard({ order }: { order: Order }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const firstItem = order.items[0];
  const totalQty = order.items.reduce((a, i) => a + i.quantity, 0);
  const productLabel = buildProductLabel(order.items);
  const paymentLabel = PAYMENT_LABELS[order.payment?.method] ?? order.payment?.method ?? "";

  return (
    <Link
      href={`/account/orders/${order._id}`}
      className="block group border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all bg-white overflow-hidden"
    >
      <div className="p-4 flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          {firstItem?.image ? (
            <Image
              src={firstItem.image}
              alt={firstItem.name}
              fill
              sizes="72px"
              className="object-contain p-1.5"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-7 h-7 text-gray-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">
            {productLabel}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.pill}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            {new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {paymentLabel ? ` · ${paymentLabel}` : ""}
            {` · ${totalQty} artículo${totalQty !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Total + arrow */}
        <div className="flex flex-col items-end justify-between h-[72px] shrink-0">
          <span className="text-base font-bold text-gray-900">
            ${order.total.toLocaleString("es-AR")}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1E3A8A] transition-colors" />
        </div>
      </div>

      {/* Status description */}
      <div className="px-4 pb-3.5 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <p className="text-xs text-gray-500">{cfg.description}</p>
      </div>
    </Link>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <div className="p-4 flex items-start gap-4">
        <div className="w-[72px] h-[72px] shrink-0 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-5 bg-gray-100 rounded w-20 shrink-0" />
      </div>
      <div className="px-4 pb-3.5">
        <div className="h-3 bg-gray-100 rounded w-40" />
      </div>
    </div>
  );
}

export default function OrdersClient() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders/user")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [status]);

  if (isLoading || status === "loading") {
    return (
      <div className="space-y-4">
        <div className="h-7 bg-gray-100 rounded w-48 animate-pulse mb-2" />
        <div className="h-3 bg-gray-100 rounded w-24 animate-pulse mb-5" />
        {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
      </div>
    );
  }

  const grouped = groupOrders(orders);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mis compras</h2>
          {orders.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {orders.length} compra{orders.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-[#1E3A8A] font-medium hover:underline"
        >
          Seguir comprando
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Todavía no tenés compras</p>
          <p className="text-sm text-gray-400 mb-5">
            Cuando realices una compra, aparecerá acá
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Explorar productos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map(([period, periodOrders]) => (
            <div key={period}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-1">
                {period}
              </h3>
              <div className="space-y-3">
                {periodOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
