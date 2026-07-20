import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Preference } from "mercadopago";
import { getMpClient } from "@/lib/mercadopago";
import { getModels } from "@/lib/tenant-models";
import { getBaseUrl } from "@/lib/base-url";
import { MP_PREFERENCE_TTL_MS, releaseStock, toStockLines } from "@/lib/stock";
import { CheckoutPayloadSchema, createCheckoutOrder } from "@/lib/checkout";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const parsed = CheckoutPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }

    const result = await createCheckoutOrder({
      ...parsed.data,
      paymentMethod: "mercadopago",
      customerEmail: session.user.email ?? "",
    });
    if (!result.ok) {
      const { error, details, status } = result;
      return NextResponse.json({ error, ...(details && { details }) }, { status });
    }
    const { order, authoritativeItems, discount, total } = result;

    const preference = new Preference(await getMpClient());

    // Con cupón aplicado, Mercado Pago cobra el total ya rebajado como un único
    // concepto (Checkout Pro no admite líneas de descuento con precio negativo).
    // El detalle por producto queda en el checkout de la tienda, igual que en
    // Tiendanube o Shopify. Sin descuento se mantiene el detalle por producto.
    const mpItems =
      discount > 0
        ? [
            {
              id: String(order._id),
              title: `Pedido ${order.orderNumber}`,
              quantity: 1,
              unit_price: total,
              currency_id: "ARS",
            },
          ]
        : authoritativeItems.map((item) => ({
            id: String(item.productId),
            title: item.variant ? `${item.name} (Talle ${item.variant.value})` : item.name,
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: "ARS",
          }));

    const baseUrl = await getBaseUrl();

    const isProd = process.env.NODE_ENV === "production";

    let response;
    try {
      response = await preference.create({
        body: {
          items: mpItems,
          external_reference: String(order._id),
          back_urls: {
            success: `${baseUrl}/order-success?orderId=${order._id}`,
            failure: `${baseUrl}/checkout?error=pago_fallido`,
            pending: `${baseUrl}/order-success?orderId=${order._id}`,
          },
          ...(isProd && { auto_return: "approved" }),
          notification_url: `${baseUrl}/api/payments/webhook`,
          // La preferencia expira antes de que venza la reserva de stock:
          // pasado ese punto ya no se puede pagar una orden liberada
          expires: true,
          expiration_date_to: new Date(Date.now() + MP_PREFERENCE_TTL_MS)
            .toISOString()
            .replace("Z", "+00:00"),
        },
      });
    } catch (err) {
      // Sin preferencia no hay pago posible: liberar la reserva y cerrar la orden
      const { Order, Product } = await getModels();
      await Promise.all([
        releaseStock(Product, toStockLines(authoritativeItems)),
        Order.findByIdAndUpdate(order._id, {
          $set: { status: "cancelled", "payment.status": "failed", stockReserved: false },
        }),
      ]);
      throw err;
    }

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      orderId: order._id,
    });
  } catch (error: unknown) {
    console.error("Error creando preferencia MP:", error);
    return NextResponse.json(
      { error: "Error creando preferencia" },
      { status: 500 }
    );
  }
}
