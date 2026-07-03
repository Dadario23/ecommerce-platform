import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { isAdmin } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const UpdateRoleSchema = z.object({
  role: z.enum(["user", "technician", "receptionist"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = UpdateRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  const { role } = parsed.data;

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, select: "name email role" },
  ).lean();

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json(user);
}
