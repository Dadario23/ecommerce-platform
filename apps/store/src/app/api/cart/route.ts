import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Cart from "@/models/Cart";
import { getModels } from "@/lib/tenant-models";

const normalizeItems = (items: any) => {
  if (!items) return [];
  if (!Array.isArray(items)) {
    console.warn("[API CART] Formato inesperado en items:", items);
    return [];
  }
  return items;
};

export async function GET() {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = new Cart({ userId: session.user.id, items: [] });
      await cart.save();
    }

    return NextResponse.json({ items: normalizeItems(cart.items) }, { status: 200 });
  } catch (error) {
    console.error("[API CART] Error en GET:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body || {};

    if (!Array.isArray(items)) {
      console.warn("[API CART] Formato inválido de items:", items);
      return NextResponse.json(
        { error: "Formato de items inválido" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      {
        items,
        $setOnInsert: { userId: session.user.id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({ success: true, items: cart.items });
  } catch (error) {
    console.error("[API CART] Error en POST:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { items: [] },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      reset: true,
      items: [],
    });
  } catch (error) {
    console.error("[API CART] Error en DELETE:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
