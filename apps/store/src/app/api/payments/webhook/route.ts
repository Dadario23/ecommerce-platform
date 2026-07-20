import { NextRequest, NextResponse } from "next/server";
import type { IOrderItem } from "@/models/Order";
import { Payment } from "mercadopago";
import { getMpClient } from "@/lib/mercadopago";
import { getTenantSecrets } from "@/lib/tenant-secrets";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOpsAlert } from "@/lib/ops-alert";
import crypto from "crypto";
import { getModels } from "@/lib/tenant-models";
import { releaseStock, toStockLines } from "@/lib/stock";

function verifyMercadoPagoSignature(request: NextRequest, secret: string): boolean {
  // Si no hay secret configurado en producción, rechazar
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const { searchParams } = new URL(request.url);
  const dataId = searchParams.get("data.id");

  if (!xSignature || !xRequestId) return false;

  // Formato: ts=<timestamp>,v1=<hash>
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const signedTemplate = `id:${dataId ?? ""};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(signedTemplate).digest("hex");

  // Hashear ambos lados fija la longitud: timingSafeEqual lanza si difieren
  const a = crypto.createHash("sha256").update(v1).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const { mpWebhookSecret } = await getTenantSecrets();
    if (!verifyMercadoPagoSignature(request, mpWebhookSecret)) {
      // Con headers de MP presentes no es un scanner: probable secret mal
      // configurado tras un onboarding — todos los pagos quedarían sin confirmar
      if (request.headers.get("x-signature") && request.headers.get("x-request-id")) {
        await sendOpsAlert("Webhook MP con firma inválida", [
          "Un webhook con formato de Mercado Pago no pasó la verificación HMAC.",
          "Si se repite, revisar mpWebhookSecret en el Setting del tenant (o MP_WEBHOOK_SECRET).",
        ]);
      }
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const { Coupon, Order, Product, Reparacion } = await getModels();

    const body = JSON.parse(rawBody) as { type: string; data: { id: string } };
    const { type, data } = body;

    if (type === "payment") {
      const payment = new Payment(await getMpClient());
      const paymentData = await payment.get({ id: data.id });

      const externalRef   = paymentData.external_reference ?? "";
      const paymentStatus = paymentData.status;

      // ── Pago de reparación ──────────────────────────────────────────
      if (externalRef.startsWith("REP-")) {
        const repId = externalRef.slice(4);
        const rep = await Reparacion.findById(repId);
        if (!rep) {
          return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
        }
        // Reintento de MP sobre un pago ya registrado: no reprocesar
        if (rep.pago?.estado === "aprobado") {
          return NextResponse.json({ success: true });
        }
        if (paymentStatus === "approved") {
          rep.pago = { estado: "aprobado", mpId: String(paymentData.id), fecha: new Date() };
        } else if (paymentStatus === "rejected") {
          rep.pago = { estado: "rechazado", mpId: String(paymentData.id), fecha: new Date() };
        }
        await rep.save();
        return NextResponse.json({ success: true });
      }

      // ── Pago de orden de tienda ─────────────────────────────────────
      const orderId = externalRef;

      if (paymentStatus === "approved") {
        // Claim atómico: solo el primer webhook que llega descuenta stock
        // y envía el email; los reintentos de MP no matchean la condición
        const order = await Order.findOneAndUpdate(
          { _id: orderId, "payment.status": { $ne: "completed" } },
          {
            $set: {
              "payment.status": "completed",
              "payment.transactionId": String(paymentData.id),
              "payment.paymentDate": new Date(),
              status: "confirmed",
            },
          },
          { new: true },
        );

        if (!order) {
          const exists = await Order.exists({ _id: orderId });
          if (!exists) {
            // Cobro aprobado sin orden asociada: plata del cliente en el aire
            await sendOpsAlert("Pago MP aprobado sin orden", [
              `Pago MP ${paymentData.id} aprobado con external_reference "${orderId}" que no existe.`,
              "Revisar el pago en el panel de MP y contactar al cliente si corresponde.",
            ]);
            return NextResponse.json(
              { error: "Orden no encontrada" },
              { status: 404 },
            );
          }
          // Ya procesada por un webhook anterior
          return NextResponse.json({ success: true });
        }

        // Contabilizar cupón y enviar email al confirmar el pago. El stock
        // solo se descuenta si la orden no lo reservó al crear la preferencia
        // (órdenes anteriores a la reserva de stock).
        await Promise.all([
          ...(order.stockReserved
            ? []
            : order.items.map((item: IOrderItem) =>
                Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
              )),
          ...(order.couponCode
            ? [Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 } })]
            : []),
          sendOrderConfirmation({
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            items: order.items.map((i: IOrderItem) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              variant: i.variant?.value,
            })),
            total: order.total,
            paymentMethod: "mercadopago",
            shippingAddress: order.shippingAddress,
          }).catch(() =>
            sendOpsAlert("Falló el email de confirmación de orden", [
              `Orden ${order.orderNumber} (${order.customerEmail}): el pago se confirmó pero el email no salió.`,
              "Revisar RESEND_API_KEY / fromEmail del tenant.",
            ])
          ),
        ]);
      } else if (paymentStatus === "rejected") {
        // Solo el primer rechazo matchea (no degrada una orden completada ni
        // repite la liberación de stock en reintentos). findOneAndUpdate
        // devuelve el doc previo: stockReserved indica si había reserva.
        const order = await Order.findOneAndUpdate(
          { _id: orderId, "payment.status": { $nin: ["completed", "failed"] } },
          { $set: { "payment.status": "failed", status: "cancelled", stockReserved: false } },
        );
        if (order?.stockReserved) {
          await releaseStock(Product, toStockLines(order.items));
        }
        if (!order && !(await Order.exists({ _id: orderId }))) {
          return NextResponse.json(
            { error: "Orden no encontrada" },
            { status: 404 },
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en webhook de pago:", error);
    // MP reintenta ante 500, pero si el error persiste hay pagos aprobados
    // sin orden confirmada: eso no puede morir solo en los logs
    await sendOpsAlert("Error procesando webhook MP", [
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      "MP va a reintentar; si esta alerta se repite, investigar ya (pagos sin confirmar).",
    ]);
    return NextResponse.json(
      { error: "Error procesando el webhook" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "webhook activo" });
}
