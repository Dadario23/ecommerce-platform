import { NextResponse } from "next/server";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    // Solo categorías publicadas, con campos básicos
    const categories = await Category.find(
      { status: "published" },
      "name slug description thumbnail",
    ).sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 },
    );
  }
}
