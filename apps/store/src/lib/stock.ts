import type { Model, Types } from "mongoose";
import type { IOrder } from "@/models/Order";
import type { IProduct } from "@/models/Product";

export type StockLine = {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
};

// La preferencia de MP expira antes de que se libere la reserva: el margen
// evita liberar stock de un pago hecho justo sobre la hora de expiración.
export const MP_PREFERENCE_TTL_MS = 30 * 60 * 1000;
export const RESERVATION_TTL_MS = 45 * 60 * 1000;

export async function releaseStock(
  Product: Model<IProduct>,
  items: StockLine[]
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
    )
  );
}

// Descuenta stock de forma atómica: la condición stock >= cantidad evita que
// dos compras concurrentes reserven las mismas unidades. Si una línea no
// alcanza, revierte las anteriores y devuelve el ítem que falló.
export async function reserveStock(
  Product: Model<IProduct>,
  items: StockLine[]
): Promise<{ ok: true } | { ok: false; failed: StockLine }> {
  const reserved: StockLine[] = [];
  for (const item of items) {
    const claimed = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        isActive: { $ne: false },
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } }
    );
    if (!claimed) {
      await releaseStock(Product, reserved);
      return { ok: false, failed: item };
    }
    reserved.push(item);
  }
  return { ok: true };
}

// Libera reservas de órdenes MP que nunca se pagaron (checkout abandonado).
// Se invoca al iniciar un checkout: barato cuando no hay nada vencido.
export async function releaseExpiredReservations(
  Order: Model<IOrder>,
  Product: Model<IProduct>
): Promise<void> {
  const stale = await Order.find({
    "payment.method": "mercadopago",
    "payment.status": "pending",
    stockReserved: true,
    createdAt: { $lt: new Date(Date.now() - RESERVATION_TTL_MS) },
  }).select("_id");

  for (const doc of stale) {
    // Claim atómico por si dos checkouts intentan liberar la misma orden
    const claimed = await Order.findOneAndUpdate(
      { _id: doc._id, stockReserved: true },
      {
        $set: {
          stockReserved: false,
          status: "cancelled",
          "payment.status": "failed",
        },
      }
    );
    if (claimed) await releaseStock(Product, claimed.items);
  }
}
