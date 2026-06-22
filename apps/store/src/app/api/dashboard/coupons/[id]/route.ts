import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { getModels } from "@/lib/tenant-models";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await context.params;
  const body = await request.json();

  const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });
  if (!coupon) return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });

  return NextResponse.json(coupon);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await context.params;
  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
