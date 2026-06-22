// Solo disponible en desarrollo
import { NextResponse } from "next/server";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    return NextResponse.json({ ok: true, message: "Conectado a MongoDB" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message });
  }
}
