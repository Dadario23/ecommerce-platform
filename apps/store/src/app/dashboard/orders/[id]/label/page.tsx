import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { getTenantSecrets } from "@/lib/tenant-secrets";
import { getClientConfig } from "@/config/client";
import Link from "next/link";
import PrintButton from "./PrintButton";
import { resolveShippingLocation } from "@/lib/cp-lookup";

async function getOrCreateMpLink(
  orderId: string,
  order: {
    orderNumber: string;
    total: number;
    mpPaymentLink?: string;
  },
  OrderModel: Awaited<ReturnType<typeof getModels>>["Order"]
): Promise<string | null> {
  if (order.mpPaymentLink) return order.mpPaymentLink;

  const [{ mpAccessToken: token }, { storeName }] = await Promise.all([
    getTenantSecrets(),
    getClientConfig(),
  ]);
  if (!token) return null;

  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Pedido #${order.orderNumber}`,
          quantity: 1,
          unit_price: Math.round(order.total * 100) / 100,
          currency_id: "ARS",
        }],
        external_reference: orderId,
        statement_descriptor: storeName,
        binary_mode: true,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const link: string = data.init_point;

    await OrderModel.findByIdAndUpdate(orderId, { mpPaymentLink: link });
    return link;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { id } = await params;
  const { Order, ShippingConfig } = await getModels();

  const order = await Order.findById(id).lean<{
    orderNumber: string;
    total: number;
    items: { name: string; quantity: number; price: number; variant?: { name: string; value: string } }[];
    shippingAddress: {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
    };
    payment: { method: string; status: string };
    status: string;
    createdAt: Date;
    mpPaymentLink?: string;
  }>();

  if (!order) notFound();

  const addr        = order.shippingAddress;
  const isCash      = order.payment.method === "cash";
  const isTransfer  = order.payment.method === "transfer";
  const { transferAlias: mpAlias } = await getTenantSecrets();

  const shippingConfig = await ShippingConfig.findOne().lean<{ zones: { id: string; name: string; zipRanges?: { min: number; max: number }[] }[] }>();
  const shippingLocation = addr.zipCode
    ? resolveShippingLocation(addr.zipCode, addr.city, shippingConfig?.zones ?? [])
    : null;

  // Para transferencia: usar link de MP (se genera automáticamente la primera vez)
  const mpLink = isTransfer
    ? await getOrCreateMpLink(id, order, Order)
    : null;

  // QR del header: siempre el número de orden (identificación del paquete)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.orderNumber)}&bgcolor=ffffff&color=000000&margin=6`;
  // QR de pago: link de MP con el monto exacto (solo para transferencia)
  const payQrUrl = mpLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mpLink)}&bgcolor=ffffff&color=000000&margin=4`
    : null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #shipping-label, #shipping-label * { visibility: visible !important; }
          #shipping-label {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 105mm !important;
            min-height: 148mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          @page { size: A6 portrait; margin: 0; }
        }
      `}</style>

      {/* Screen controls */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/orders"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Volver a órdenes
        </Link>
        <PrintButton />
      </div>

      {/* A6 Label: 105mm × 148mm */}
      <div
        id="shipping-label"
        style={{
          width: "105mm",
          minHeight: "148mm",
          fontFamily: "'Arial', sans-serif",
          fontSize: "10pt",
          lineHeight: 1.4,
          border: "1.5px solid #000",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#111111",
            padding: "4.5mm 5mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Logo"
            style={{ height: "26px", filter: "brightness(0) invert(1)" }}
          />
          <span
            style={{
              color: "#aaaaaa",
              fontSize: "6.5pt",
              fontWeight: "bold",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Etiqueta de envío
          </span>
        </div>

        <div style={{ padding: "4mm 5mm 5mm" }}>
          {/* PARA */}
          <div style={{ marginBottom: "3.5mm" }}>
            <p
              style={{
                fontSize: "6.5pt",
                fontWeight: "700",
                color: "#888888",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "1.5mm",
              }}
            >
              Para
            </p>
            <p style={{ fontWeight: "700", fontSize: "13pt", color: "#000000", marginBottom: "1.5mm" }}>
              {addr.firstName} {addr.lastName}
            </p>
            <p style={{ color: "#333333", fontSize: "9pt", marginBottom: "1.5mm" }}>{addr.street}</p>

            {/* Zona + barrio/municipio */}
            {shippingLocation ? (
              <div style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "1mm" }}>
                <span style={{
                  background: "#111111", color: "#ffffff",
                  fontSize: "6pt", fontWeight: "700",
                  padding: "0.8mm 2.5mm", borderRadius: "3px",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  flexShrink: 0,
                }}>
                  {shippingLocation.zoneName}
                </span>
                <span style={{ color: "#222222", fontSize: "8.5pt", fontWeight: "600" }}>
                  {shippingLocation.neighborhood}
                </span>
              </div>
            ) : (
              <p style={{ color: "#333333", fontSize: "9pt", marginBottom: "1mm" }}>
                {addr.city}, {addr.state}
              </p>
            )}

            <p style={{ color: "#777777", fontSize: "7.5pt" }}>
              {addr.zipCode ? `CP ${addr.zipCode} · ` : ""}{addr.state}
            </p>
            {addr.phone && (
              <p style={{ color: "#555555", fontSize: "8.5pt", marginTop: "1mm" }}>
                Tel: {addr.phone}
              </p>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #cccccc", margin: "3mm 0" }} />

          {/* Order number + QR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "3.5mm",
              gap: "3mm",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "6.5pt",
                  fontWeight: "700",
                  color: "#888888",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1.5mm",
                }}
              >
                Orden
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontWeight: "700",
                  fontSize: "10pt",
                  color: "#000000",
                  letterSpacing: "0.02em",
                }}
              >
                #{order.orderNumber}
              </p>
              <p style={{ fontSize: "7.5pt", color: "#666666", marginTop: "1mm" }}>
                {new Date(order.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`QR ${order.orderNumber}`}
              style={{ width: "26mm", height: "26mm", flexShrink: 0 }}
            />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #cccccc", margin: "3mm 0" }} />

          {/* Pago */}
          {isCash && (
            <div style={{ border: "2px solid #000000", borderRadius: "4px", padding: "3mm 4mm", textAlign: "center" }}>
              <p style={{ fontSize: "6.5pt", fontWeight: "700", color: "#555555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5mm" }}>
                Cobrar al destinatario — Efectivo
              </p>
              <p style={{ fontWeight: "700", fontSize: "18pt", color: "#000000", lineHeight: 1.2 }}>
                ${order.total.toLocaleString("es-AR")}
              </p>
            </div>
          )}

          {isTransfer && (
            <div style={{ border: "2px solid #000000", borderRadius: "4px", padding: "3mm 4mm" }}>
              <p style={{ fontSize: "6.5pt", fontWeight: "700", color: "#555555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2mm", textAlign: "center" }}>
                Cobrar por transferencia
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
                {/* QR de pago grande */}
                {payQrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={payQrUrl}
                    alt="QR Pago"
                    style={{ width: "28mm", height: "28mm", flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ fontWeight: "700", fontSize: "14pt", color: "#000000", lineHeight: 1.2, marginBottom: "2mm" }}>
                    ${order.total.toLocaleString("es-AR")}
                  </p>
                  <p style={{ fontSize: "6pt", color: "#555555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1mm" }}>Alias</p>
                  <p style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "8pt", color: "#000000", marginBottom: "2mm" }}>{mpAlias}</p>
                  <p style={{ fontSize: "5.5pt", color: "#777777" }}>Escaneá el QR con la app<br/>de Mercado Pago</p>
                </div>
              </div>
            </div>
          )}

          {!isCash && !isTransfer && (
            <div style={{ border: "1px solid #cccccc", borderRadius: "4px", padding: "2.5mm 4mm", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontWeight: "700", fontSize: "11pt", color: "#000000" }}>
                ${order.total.toLocaleString("es-AR")}
              </p>
              <span style={{ color: "#555555", fontWeight: "700", fontSize: "7pt", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Pago acreditado
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
