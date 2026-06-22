import { NextRequest, NextResponse } from "next/server";
import Reparacion from "@/models/Reparacion";
import { getModels } from "@/lib/tenant-models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  try {
    const { codigo } = await params;
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const rep = await Reparacion.findOne(
      { codigo: codigo.toUpperCase() },
      { notaInterna: 0 },
    ).lean();
    if (!rep) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(rep);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
