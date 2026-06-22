// app/api/user/addresses/[id]/route.ts
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
    const addressData = await request.json();

    // Si se marca como default, quitar el default de las demás
    if (addressData.isDefault) {
      await User.updateOne(
        { email: session.user.email, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
        "addresses._id": id,
      },
      {
        $set: {
          "addresses.$.title": addressData.title,
          "addresses.$.firstName": addressData.firstName,
          "addresses.$.lastName": addressData.lastName,
          "addresses.$.street": addressData.street,
          "addresses.$.city": addressData.city,
          "addresses.$.state": addressData.state,
          "addresses.$.zipCode": addressData.zipCode,
          "addresses.$.country": addressData.country,
          "addresses.$.phone": addressData.phone,
          "addresses.$.isDefault": addressData.isDefault,
        },
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
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Error actualizando dirección" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verificar si el domicilio a borrar es el default
    const existing = await User.findOne({ email: session.user.email }).select("addresses").lean<{ addresses: { _id: { toString(): string }; isDefault: boolean }[] }>();
    const deletingDefault = existing?.addresses?.find((a) => a._id.toString() === id)?.isDefault ?? false;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { addresses: { _id: id } } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si se borró el default y quedan direcciones, asignar el primero como default
    if (deletingDefault && user.addresses.length > 0) {
      await User.updateOne(
        { email: session.user.email, "addresses._id": user.addresses[0]._id },
        { $set: { "addresses.$.isDefault": true } }
      );
      user.addresses[0].isDefault = true;
    }

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Error eliminando dirección" },
      { status: 500 }
    );
  }
}
