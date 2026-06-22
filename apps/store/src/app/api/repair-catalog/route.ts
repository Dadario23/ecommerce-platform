import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RepairCatalog from "@/models/RepairCatalog";
import { getModels } from "@/lib/tenant-models";

// GET /api/repair-catalog?device=celular  → chatbot (public)
// GET /api/repair-catalog                 → admin list
export async function GET(request: NextRequest) {
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const device = request.nextUrl.searchParams.get("device");

  if (device) {
    if (!["celular", "laptop", "pc"].includes(device)) {
      return NextResponse.json({ error: "Tipo de equipo inválido" }, { status: 400 });
    }

    const items = await RepairCatalog.find({ deviceType: device, active: true })
      .select("brand model repairs")
      .lean<{ brand: string; model: string; repairs: { type: string; price: number }[] }[]>();

    const brands = [...new Set(items.map((i) => i.brand))].sort();
    const models = items.map((i) => ({ brand: i.brand, model: i.model }));
    const prices = items.flatMap((i) =>
      i.repairs.map((r) => ({
        brand: i.brand,
        model: i.model,
        repairType: r.type,
        price: r.price,
      }))
    );

    return NextResponse.json({ brands, models, prices });
  }

  // Admin list
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const items = await RepairCatalog.find().sort({ deviceType: 1, brand: 1, model: 1 }).lean();
  return NextResponse.json(items);
}

// POST /api/repair-catalog  → admin create
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const body = await request.json();
  const { deviceType, brand, model, active, repairs } = body;

  if (!deviceType || !brand?.trim() || !model?.trim()) {
    return NextResponse.json({ error: "deviceType, brand y model son obligatorios" }, { status: 400 });
  }

  try {
    const entry = await RepairCatalog.create({
      deviceType,
      brand: brand.trim(),
      model: model.trim(),
      active: active ?? true,
      repairs: repairs ?? [],
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      return NextResponse.json(
        { error: "Ya existe una entrada para ese dispositivo/marca/modelo" },
        { status: 409 }
      );
    }
    console.error("[POST /api/repair-catalog]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
