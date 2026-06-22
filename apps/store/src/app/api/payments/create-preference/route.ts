import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Preference } from "mercadopago";
import client from "@/lib/mercadopago";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { getModels } from "@/lib/tenant-models";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const orderData = await request.json();
    const items: CartItem[] = orderData.items;

    // Validar stock antes de crear la preferencia
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
      discount: orderData.discount ?? 0,
      total: orderData.total,
      shippingAddress: orderData.shippingAddress,
      payment: {
        method: "mercadopago",
        status: "pending",
      },
      status: "pending",
      shippingMethod: orderData.shippingMethod,
      notes: orderData.notes,
    });

    await order.save();

    const preference = new Preference(client);

    const mpItems = items.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "ARS",
    }));

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const isProd = process.env.NODE_ENV === "production";

    const response = await preference.create({
      body: {
        items: mpItems,
        external_reference: order._id.toString(),
        back_urls: {
          success: `${baseUrl}/order-success?orderId=${order._id}`,
          failure: `${baseUrl}/checkout?error=pago_fallido`,
          pending: `${baseUrl}/order-success?orderId=${order._id}`,
        },
        ...(isProd && { auto_return: "approved" }),
        notification_url: `${baseUrl}/api/payments/webhook`,
      },
    });

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      orderId: order._id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error creando preferencia MP:", error);
    return NextResponse.json(
      { error: "Error creando preferencia", details: msg },
      { status: 500 }
    );
  }
}
