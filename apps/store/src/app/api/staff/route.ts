import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { isAdmin } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const users = await User.find(
    {},
    { name: 1, email: 1, role: 1, createdAt: 1 },
  ).sort({ role: 1, name: 1 }).lean();
  return NextResponse.json(users);
}
