"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Package,
  Truck,
  Home,
  ClipboardList,
  Mail,
  ArrowRight,
} from "lucide-react";

interface OrderData {
  orderNumber: string;
  total: number;
  createdAt: string;
  itemsCount: number;
  paymentMethod?: string;
}

const STEPS = [
  { icon: CheckCircle, label: "Pedido confirmado", done: true },
  { icon: Package, label: "Preparando envío", done: false },
  { icon: Truck, label: "En camino", done: false },
  { icon: Home, label: "Entregado", done: false },
];

export default function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setIsLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((order) => {
        if (order) {
          setOrderData({
            orderNumber: order.orderNumber,
            total: order.total,
            createdAt: new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            itemsCount: order.items.length,
            paymentMethod: order.paymentMethod,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="pt-20 md:pt-32 min-h-screen bg-gray-50 minimal:bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
      <div className="max-w-lg mx-auto px-4">

        {/* Success card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-linear-to-b from-green-50 to-white px-6 pt-10 pb-6 text-center">
            <div className="relative inline-flex mb-5">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <span className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-30" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              ¡Pedido confirmado!
            </h1>
            <p className="text-sm text-gray-500">
              Tu compra fue procesada exitosamente. Te enviamos los detalles por email.
            </p>
          </div>

          {/* Order info */}
          {orderData && (
            <div className="mx-5 mb-5 bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                  Nº de pedido
                </p>
                <p className="text-sm font-bold text-gray-800 font-mono">
                  {orderData.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                  Fecha
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {orderData.createdAt}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                  Total
                </p>
                <p className="text-sm font-bold text-gray-900">
                  ${orderData.total.toLocaleString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                  Productos
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {orderData.itemsCount} artículo{orderData.itemsCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="px-6 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Estado del envío
            </p>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />

              <div className="space-y-4">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          step.done
                            ? "bg-green-500"
                            : i === 1
                            ? "bg-(--tenant-primary)"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            step.done || i === 1 ? "text-white" : "text-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            step.done
                              ? "text-green-700"
                              : i === 1
                              ? "text-(--tenant-primary)"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.done && (
                          <p className="text-xs text-gray-400">Completado</p>
                        )}
                        {i === 1 && (
                          <p className="text-xs text-blue-500">En proceso</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="mx-5 mb-5 flex items-start gap-3 bg-blue-50 rounded-xl p-4">
            <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-0.5">
                ¿Necesitás ayuda?
              </p>
              <p className="text-xs text-blue-600">
                Escribinos a{" "}
                <a
                  href="mailto:soporte@bitm-cel.com.ar"
                  className="underline underline-offset-2 hover:text-blue-800"
                >
                  soporte@bitm-cel.com.ar
                </a>{" "}
                — Lunes a Viernes 9 a 18 hs
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="px-5 pb-6 flex flex-col gap-3">
            <button
              onClick={() => router.push("/account/orders")}
              className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              Ver mis pedidos
            </button>
            <Link
              href="/"
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2 flex items-center justify-center gap-1.5 transition-colors"
            >
              Seguir comprando
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
