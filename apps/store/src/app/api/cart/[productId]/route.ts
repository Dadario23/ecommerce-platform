import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { productId } = await context.params;

    const cart = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { $pull: { items: { id: productId } } },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      items: cart?.items || [],
    });
  } catch (error) {
    console.error("[API CART] Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
