import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
