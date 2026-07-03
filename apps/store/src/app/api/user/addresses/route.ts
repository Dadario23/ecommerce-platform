// app/api/user/addresses/route.ts (Para App Router)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const AddressInputSchema = z.object({
  title: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  street: z.string().trim().min(1),
  betweenStreets: z.string().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  zipCode: z.string().trim().min(1),
  country: z.string().trim().min(1).default("Argentina"),
  phone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional().default(false),
});

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

    const parsed = AddressInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dirección inválida" }, { status: 400 });
    }
    const addressData = parsed.data;

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
