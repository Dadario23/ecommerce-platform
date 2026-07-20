import type { Model, Types } from "mongoose";
import type { IOrder } from "@/models/Order";
import type { IProduct } from "@/models/Product";

export type StockLine = {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  size?: string;
};

// Adapta ítems de orden/checkout (con variant) a líneas de stock (con size).
// IOrderItem y CheckoutItem cumplen esta forma estructuralmente.
export function toStockLines(
  items: {
    productId: Types.ObjectId;
    name: string;
    quantity: number;
    variant?: { value: string } | null;
  }[]
): StockLine[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    ...(item.variant?.value ? { size: item.variant.value } : {}),
  }));
}

// La preferencia de MP expira antes de que se libere la reserva: el margen
// evita liberar stock de un pago hecho justo sobre la hora de expiración.
export const MP_PREFERENCE_TTL_MS = 30 * 60 * 1000;
export const RESERVATION_TTL_MS = 45 * 60 * 1000;

export async function releaseStock(
  Product: Model<IProduct>,
  items: StockLine[]
): Promise<void> {
  await Promise.all(
    items.map(async (item) => {
      if (item.size) {
        // El par de $inc mantiene la invariante stock === sum(sizes.stock).
        // Si el admin borró el talle mientras había una reserva, no devolver
        // solo al total (romperia la invariante): no-op logueado.
        const res = await Product.updateOne(
          { _id: item.productId, "sizes.value": item.size },
          { $inc: { "sizes.$.stock": item.quantity, stock: item.quantity } }
        );
        if (res.matchedCount === 0) {
          console.error(
            `[stock] release: talle "${item.size}" inexistente en producto ${item.productId} — ${item.quantity} unidades no devueltas`
          );
        }
      } else {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    })
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
    // Con talle: un solo update atómico decrementa el talle Y el total
    // derivado; el $elemMatch garantiza que el elemento decrementado es el
    // que tiene stock suficiente (values únicos por producto).
    const claimed = item.size
      ? await Product.findOneAndUpdate(
          {
            _id: item.productId,
            isActive: { $ne: false },
            sizes: { $elemMatch: { value: item.size, stock: { $gte: item.quantity } } },
          },
          { $inc: { "sizes.$[s].stock": -item.quantity, stock: -item.quantity } },
          { arrayFilters: [{ "s.value": item.size }] }
        )
      : await Product.findOneAndUpdate(
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
    if (claimed) await releaseStock(Product, toStockLines(claimed.items));
  }
}
