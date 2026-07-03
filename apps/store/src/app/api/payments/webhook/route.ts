import { NextRequest, NextResponse } from "next/server";
import Order, { IOrderItem } from "@/models/Order";
import Product from "@/models/Product";
import Reparacion from "@/models/Reparacion";
import { Payment } from "mercadopago";
import client from "@/lib/mercadopago";
import { sendOrderConfirmation } from "@/lib/email";
import crypto from "crypto";
import { getModels } from "@/lib/tenant-models";

function verifyMercadoPagoSignature(request: NextRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
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

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!verifyMercadoPagoSignature(request)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    const body = JSON.parse(rawBody) as { type: string; data: { id: string } };
    const { type, data } = body;

    if (type === "payment") {
      const payment = new Payment(client);
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
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404 },
        );
      }

      if (paymentStatus === "approved") {
        order.payment.status = "completed";
        order.payment.transactionId = String(paymentData.id);
        order.payment.paymentDate = new Date();
        order.status = "confirmed";
        await order.save();

        // Descontar stock y enviar email al confirmar el pago
        await Promise.all([
          ...order.items.map((item: IOrderItem) =>
            Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
          ),
          sendOrderConfirmation({
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            items: order.items.map((i: IOrderItem) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            total: order.total,
            paymentMethod: "mercadopago",
            shippingAddress: order.shippingAddress,
          }).catch(() => {}),
        ]);
      } else if (paymentStatus === "rejected") {
        order.payment.status = "failed";
        order.status = "cancelled";
        await order.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en webhook de pago:", error);
    return NextResponse.json(
      { error: "Error procesando el webhook" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "webhook activo" });
}
