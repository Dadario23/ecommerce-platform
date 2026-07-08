import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { CheckoutPayloadSchema, createCheckoutOrder } from "@/lib/checkout";

const OrderPayloadSchema = CheckoutPayloadSchema.extend({
  paymentMethod: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const parsed = OrderPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }
    const orderData = parsed.data;

    const result = await createCheckoutOrder({
      ...orderData,
      customerEmail: session.user.email ?? "",
    });
    if (!result.ok) {
      const { error, details, status } = result;
      return NextResponse.json({ error, ...(details && { details }) }, { status });
    }
    const { order, authoritativeItems, total, couponCode } = result;

    // Marcar uso de cupón (en el flujo MP esto ocurre recién cuando el
    // webhook aprueba el pago)
    if (couponCode) {
      const { Coupon } = await getModels();
      await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
    }

    // Email de confirmación (no bloquea la respuesta si falla)
    sendOrderConfirmation({
      orderNumber: order.orderNumber,
      orderId: String(order._id),
      customerEmail: session.user.email ?? "",
      customerName: session.user.name ?? undefined,
      items: authoritativeItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error creando la orden" },
      { status: 500 }
    );
  }
}
