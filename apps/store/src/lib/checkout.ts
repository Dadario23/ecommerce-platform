import mongoose from "mongoose";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { computeCouponDiscount } from "@/lib/coupon-discount";
import { releaseExpiredReservations, releaseStock, reserveStock } from "@/lib/stock";
import type { IOrder } from "@/models/Order";

export const OrderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional().default(""),
  price: z.number().optional(),
  image: z.string().optional().default(""),
  quantity: z.number().int().positive(),
});

export const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  phone: z.string(),
});

export const CheckoutPayloadSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  couponCode: z.string().optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
  shippingAddress: AddressSchema,
});

export type CheckoutItem = {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CheckoutInput = z.infer<typeof CheckoutPayloadSchema> & {
  paymentMethod: string;
  customerEmail: string;
};

export type CheckoutResult =
  | { ok: false; status: number; error: string; details?: string[] }
  | {
      ok: true;
      order: IOrder;
      authoritativeItems: CheckoutItem[];
      subtotal: number;
      discount: number;
      total: number;
      couponCode?: string;
    };

// Flujo común de creación de orden (contraentrega/transferencia y MP):
// valida stock y cupón contra la base, recalcula los montos del lado
// servidor, reserva stock atómicamente y guarda la orden con rollback.
export async function createCheckoutOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const { Coupon, Order, Product, User } = await getModels();
  const items = input.items;

  // Liberar reservas de checkouts MP abandonados antes de validar stock
  await releaseExpiredReservations(Order, Product);

  // Validación informativa de stock (mensajes amigables por producto);
  // la garantía real contra compras concurrentes está en reserveStock
  const productIds = items.map((item) => new mongoose.Types.ObjectId(item.id));
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id name stock price isActive")
    .lean<{ _id: mongoose.Types.ObjectId; name: string; stock: number; price: number; isActive?: boolean }[]>();

  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const stockErrors: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.id);
    if (!product || product.isActive === false) {
      stockErrors.push(`"${item.name}" ya no está disponible`);
      continue;
    }
    if ((product.stock ?? 0) < item.quantity) {
      stockErrors.push(
        `"${product.name}" solo tiene ${product.stock ?? 0} unidades disponibles`
      );
    }
  }

  if (stockErrors.length > 0) {
    return { ok: false, status: 409, error: "Problemas de stock", details: stockErrors };
  }

  const user = await User.findOne({ email: input.customerEmail });
  if (!user) {
    return { ok: false, status: 404, error: "Usuario no encontrado" };
  }

  // Recalcular ítems, subtotal, descuento y total SIEMPRE desde la base.
  // Nunca confiar en los montos que envía el cliente.
  const authoritativeItems: CheckoutItem[] = items.map((item) => {
    const product = productMap.get(item.id)!; // garantizado por la validación de stock
    return {
      productId: new mongoose.Types.ObjectId(item.id),
      name: product.name,
      price: product.price,
      image: item.image,
      quantity: item.quantity,
    };
  });

  const subtotal = authoritativeItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Revalidar el cupón contra la base y recalcular el descuento del lado servidor
  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode?.trim()) {
    const coupon = await Coupon.findOne({
      code: input.couponCode.trim().toUpperCase(),
      isActive: true,
    });
    const now = new Date();
    const invalid =
      !coupon ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) ||
      (coupon.minOrder && subtotal < coupon.minOrder);
    if (invalid) {
      return { ok: false, status: 422, error: "El cupón ya no es válido" };
    }
    discount = computeCouponDiscount(coupon, subtotal);
    couponCode = coupon.code;
  }

  const total = Math.max(subtotal - discount, 0);

  // Reservar stock de forma atómica ANTES de crear la orden
  const reservation = await reserveStock(Product, authoritativeItems);
  if (!reservation.ok) {
    return {
      ok: false,
      status: 409,
      error: "Problemas de stock",
      details: [`"${reservation.failed.name}" no tiene stock suficiente`],
    };
  }

  const order = new Order({
    userId: user._id,
    customerEmail: input.customerEmail,
    items: authoritativeItems,
    subtotal,
    shipping: 0,
    tax: 0,
    discount,
    couponCode,
    total,
    shippingAddress: input.shippingAddress,
    payment: {
      method: input.paymentMethod,
      status: "pending",
    },
    status: "pending",
    shippingMethod: input.shippingMethod,
    notes: input.notes,
    stockReserved: true,
  });

  try {
    await order.save();
  } catch (err) {
    await releaseStock(Product, authoritativeItems);
    throw err;
  }

  return { ok: true, order, authoritativeItems, subtotal, discount, total, couponCode };
}
