import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const CouponUpdateSchema = z.object({
  code: z.string().trim().min(1).optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  minOrder: z.coerce.number().nonnegative().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

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
  const parsed = CouponUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};
  if (data.code !== undefined) update.code = data.code.trim().toUpperCase();
  if (data.type !== undefined) update.type = data.type;
  if (data.value !== undefined) update.value = data.value;
  if (data.minOrder !== undefined) update.minOrder = data.minOrder;
  if (data.maxUses !== undefined) update.maxUses = data.maxUses;
  if (data.expiresAt !== undefined) update.expiresAt = new Date(data.expiresAt);
  if (data.isActive !== undefined) update.isActive = data.isActive;

  const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true });
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
