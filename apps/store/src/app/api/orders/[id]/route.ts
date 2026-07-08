import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { IOrderItem } from "@/models/Order";
import { authOptions } from "@/lib/auth";
import { notifyOrderStatusChange } from "@/lib/notify";
import { getModels } from "@/lib/tenant-models";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { Order } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.customerEmail !== session.user.email && session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Error obteniendo la orden" }, { status: 500 });
  }
}

const VALID_STATUSES = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
] as const;

const CANCELLABLE = ["pending", "confirmed"];
const RESCHEDULABLE = ["pending", "confirmed", "processing"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { Coupon, Order, Product } = await getModels();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const isAdmin = session.user?.role === "admin";

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // ── Admin: cambio de estado genérico ──────────────────────────────────────
    if (isAdmin && body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      const prevStatus = order.status;
      order.status = body.status;
      await order.save();
      if (prevStatus !== body.status) {
        await notifyOrderStatusChange(order, body.status);
      }
      return NextResponse.json({ success: true, status: order.status });
    }

    // ── Acciones de usuario: verificar pertenencia ────────────────────────────
    if (order.customerEmail !== session.user.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Cancelar
    if (body.action === "cancel") {
      if (!CANCELLABLE.includes(order.status)) {
        return NextResponse.json(
          { error: "Esta orden no puede cancelarse" },
          { status: 400 }
        );
      }

      // Restaurar stock y uso de cupón si ya fueron contabilizados
      // (contraentrega: al crear la orden; MP: al aprobarse el pago)
      const stockWasDeducted =
        order.payment.method !== "mercadopago" ||
        order.payment.status === "completed";

      if (stockWasDeducted) {
        await Promise.all([
          ...order.items.map((item: IOrderItem) =>
            Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
          ),
          ...(order.couponCode
            ? [Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: -1 } })]
            : []),
        ]);
      }

      order.status = "cancelled";
      await order.save();
      return NextResponse.json({ success: true });
    }

    // Reprogramar envío
    if (body.action === "reschedule") {
      if (!RESCHEDULABLE.includes(order.status)) {
        return NextResponse.json(
          { error: "Esta orden no puede reprogramarse" },
          { status: 400 }
        );
      }

      const date = typeof body.deliveryDate === "string" ? body.deliveryDate : null;
      if (date) {
        const existing = order.notes ?? "";
        const withoutPrev = existing.replace(/Preferencia de entrega: \S+/, "").trim();
        order.notes = [withoutPrev, `Preferencia de entrega: ${date}`]
          .filter(Boolean)
          .join(" | ");
      }

      await order.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Error actualizando la orden" }, { status: 500 });
  }
}
