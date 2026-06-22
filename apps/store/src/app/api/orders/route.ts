import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import { authOptions } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";
import mongoose from "mongoose";
import { getModels } from "@/lib/tenant-models";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface OrderPayload {
  items: CartItem[];
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  total: number;
  paymentMethod: string;
  shippingMethod?: string;
  notes?: string;
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
}

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const orderData: OrderPayload = await request.json();
    const items: CartItem[] = orderData.items;

    // Validar stock antes de crear la orden
    const productIds = items.map((item) => new mongoose.Types.ObjectId(item.id));
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name stock")
      .lean<{ _id: mongoose.Types.ObjectId; name: string; stock: number }[]>();

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
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

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const transformedItems = items.map((item) => ({
      productId: new mongoose.Types.ObjectId(item.id),
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    }));

    const order = new Order({
      userId: user._id,
      customerEmail: session.user.email,
      items: transformedItems,
      subtotal,
      shipping: 0,
      tax: 0,
      discount: orderData.discount || 0,
      total: orderData.total,
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
      ...items.map((item) =>
        Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } })
      ),
      orderData.couponCode
        ? Coupon.findOneAndUpdate(
            { code: orderData.couponCode },
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
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error creando la orden", details: msg },
      { status: 500 }
    );
  }
}
