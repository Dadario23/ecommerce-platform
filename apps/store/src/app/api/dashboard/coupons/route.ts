import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const CouponCreateSchema = z.object({
  code: z.string().trim().min(1),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().nonnegative(),
  minOrder: z.coerce.number().nonnegative().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const parsed = CouponCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Campos requeridos: code, type, value" }, { status: 400 });
  }
  const { code, type, value, minOrder, maxUses, expiresAt } = parsed.data;

  try {
    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value,
      minOrder: minOrder ?? 0,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 });
    }
    throw err;
  }
}
