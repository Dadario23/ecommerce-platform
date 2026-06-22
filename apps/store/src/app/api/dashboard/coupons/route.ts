import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import { getModels } from "@/lib/tenant-models";

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
  const body = await request.json();
  const { code, type, value, minOrder, maxUses, expiresAt } = body;

  if (!code || !type || value == null) {
    return NextResponse.json({ error: "Campos requeridos: code, type, value" }, { status: 400 });
  }

  try {
    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrder: minOrder ? Number(minOrder) : 0,
      maxUses: maxUses ? Number(maxUses) : undefined,
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
