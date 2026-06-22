// app/api/user/addresses/[id]/default/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;

    // Primero, quitar el default de todas las direcciones
    await User.updateOne(
      { email: session.user.email, "addresses.isDefault": true },
      { $set: { "addresses.$.isDefault": false } }
    );

    // Luego, establecer la nueva dirección como default
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
        "addresses._id": id,
      },
      {
        $set: { "addresses.$.isDefault": true },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Dirección no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      { error: "Error estableciendo dirección principal" },
      { status: 500 }
    );
  }
}
