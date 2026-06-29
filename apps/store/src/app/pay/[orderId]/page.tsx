import { notFound } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import Image from "next/image";

const ALIAS = process.env.MP_ALIAS ?? "";
const CVU   = process.env.MP_CVU   ?? "";
const STORE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function PayPage({ params }: Props) {
  const { orderId } = await params;

  const { Order } = await getModels();

  const order = await Order.findById(orderId)
    .select("_id customerName items total subtotal shipping payment shippingMethod")
    .lean<{
      _id: string;
      customerName?: string;
      items: { name: string; quantity: number; price: number; image?: string }[];
      total: number;
      subtotal: number;
      shipping: number;
      payment: { method: string };
      shippingMethod?: string;
    }>();

  if (!order) return notFound();

  // Solo mostrar esta página para órdenes de contraentrega + transferencia
  if (order.payment.method !== "transfer") return notFound();

  const orderId_ = String(order._id);
  const payUrl   = `${STORE_URL}/pay/${orderId_}`;
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payUrl)}&bgcolor=ffffff&color=1E3A8A&qzone=1`;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-(--tenant-primary) px-6 py-5 text-center">
          <div className="relative w-32 h-10 mx-auto mb-2">
            <Image src="/logo.svg" alt="logo" fill className="object-contain brightness-0 invert" />
          </div>
          <p className="text-blue-200 text-sm">Pago de pedido</p>
          <p className="text-white font-mono text-xs mt-1 opacity-70">#{orderId_.slice(-8).toUpperCase()}</p>
        </div>

        <div className="p-6 space-y-5">

          {/* Monto */}
          <div className="text-center bg-green-50 border border-green-200 rounded-xl py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total a pagar</p>
            <p className="text-4xl font-extrabold text-green-700">
              ${order.total.toLocaleString("es-AR")}
            </p>
            {order.shipping > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Incluye envío ${order.shipping.toLocaleString("es-AR")}
              </p>
            )}
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Escaneá para ver esta página
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR de pago" width={180} height={180} className="rounded-xl border border-gray-100" />
          </div>

          {/* Datos de transferencia */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Datos para transferir
            </p>

            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Alias</p>
                  <p className="text-sm font-bold text-gray-800 font-mono">{ALIAS}</p>
                </div>
                <span className="text-xs bg-(--tenant-primary) text-white px-2 py-1 rounded-lg font-semibold">
                  Copiar
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">CVU</p>
                <p className="text-xs font-mono text-gray-700 break-all">{CVU}</p>
              </div>
            </div>
          </div>

          {/* Detalle de productos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Detalle del pedido
            </p>
            <ul className="space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-700">
                  <span className="truncate pr-2">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="font-medium shrink-0">${(item.price * item.quantity).toLocaleString("es-AR")}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Una vez realizada la transferencia mostrá el comprobante al repartidor.
          </p>
        </div>
      </div>
    </main>
  );
}
