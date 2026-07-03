import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import { authOptions } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";
import mongoose from "mongoose";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";

const OrderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional().default(""),
  price: z.number().optional(),
  image: z.string().optional().default(""),
  quantity: z.number().int().positive(),
});

const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  phone: z.string(),
});

const OrderPayloadSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(1),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
  shippingAddress: AddressSchema,
});

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const parsed = OrderPayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }
    const orderData = parsed.data;
    const items = orderData.items;

    // Validar stock antes de crear la orden
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
      return NextResponse.json(
        { error: "Problemas de stock", details: stockErrors },
        { status: 409 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Recalcular ítems, subtotal, descuento y total SIEMPRE desde la base.
    // Nunca confiar en los montos que envía el cliente.
    const authoritativeItems = items.map((item) => {
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
    let appliedCouponCode: string | undefined;
    if (orderData.couponCode?.trim()) {
      const coupon = await Coupon.findOne({
        code: orderData.couponCode.trim().toUpperCase(),
        isActive: true,
      });
      const now = new Date();
      const invalid =
        !coupon ||
        (coupon.expiresAt && coupon.expiresAt < now) ||
        (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) ||
        (coupon.minOrder && subtotal < coupon.minOrder);
      if (invalid) {
        return NextResponse.json(
          { error: "El cupón ya no es válido" },
          { status: 422 }
        );
      }
      discount =
        coupon.type === "percentage"
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
      appliedCouponCode = coupon.code;
    }

    const total = Math.max(subtotal - discount, 0);

    const order = new Order({
      userId: user._id,
      customerEmail: session.user.email,
      items: authoritativeItems,
      subtotal,
      shipping: 0,
      tax: 0,
      discount,
      total,
      shippingAddress: orderData.shippingAddress,
      payment: {
        method: orderData.paymentMethod,
        status: "pending",
      },
      status: "pending",
      shippingMethod: orderData.shippingMethod,
      notes: orderData.notes,
    });

    await order.save();

    // Descontar stock y marcar uso de cupón
    await Promise.all([
      ...authoritativeItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
      ),
      appliedCouponCode
        ? Coupon.findOneAndUpdate(
            { code: appliedCouponCode },
            { $inc: { usedCount: 1 } }
          )
        : Promise.resolve(),
    ]);

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
