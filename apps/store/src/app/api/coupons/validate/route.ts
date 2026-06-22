import { NextRequest, NextResponse } from "next/server";
import Coupon from "@/models/Coupon";
import { getModels } from "@/lib/tenant-models";

export async function POST(request: NextRequest) {
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const { code, orderTotal } = await request.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return NextResponse.json({ error: "Cupón inválido o inactivo" }, { status: 404 });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "El cupón ha expirado" }, { status: 410 });
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "El cupón ya alcanzó su límite de usos" }, { status: 410 });
  }

  if (coupon.minOrder && orderTotal < coupon.minOrder) {
    return NextResponse.json(
      {
        error: `El pedido mínimo para este cupón es $${coupon.minOrder.toLocaleString("es-AR")}`,
      },
      { status: 422 }
    );
  }

  const discount =
    coupon.type === "percentage"
      ? Math.round((orderTotal * coupon.value) / 100)
      : Math.min(coupon.value, orderTotal);

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  });
}
