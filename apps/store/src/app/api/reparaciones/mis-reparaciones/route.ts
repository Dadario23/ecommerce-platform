import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Reparacion from "@/models/Reparacion";
import User from "@/models/User";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const user = await User.findOne({ email: session.user.email }).lean<{ _id: unknown }>();
    if (!user) return NextResponse.json([]);

    const reps = await Reparacion.find(
      { userId: user._id },
      { notaInterna: 0 },
    )
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(reps);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
