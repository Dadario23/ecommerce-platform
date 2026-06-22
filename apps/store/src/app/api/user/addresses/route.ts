// app/api/user/addresses/route.ts (Para App Router)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

export async function GET(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user.addresses || []);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Error obteniendo direcciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const addressData = await request.json();

    const existingUser = await User.findOne({ email: session.user.email }).select("addresses").lean<{ addresses: { isDefault: boolean }[] }>();
    const hasAddresses = (existingUser?.addresses?.length ?? 0) > 0;

    // Si es la primera dirección, siempre queda como default
    if (!hasAddresses) {
      addressData.isDefault = true;
    } else if (addressData.isDefault) {
      // Si se marca como default, quitar el default de las demás
      await User.updateOne(
        { email: session.user.email, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $push: { addresses: addressData } },
      { new: true }
    );

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json(
      { error: "Error agregando dirección" },
      { status: 500 }
    );
  }
}
