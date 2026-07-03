import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RepairCatalog from "@/models/RepairCatalog";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";

const RepairCatalogUpdateSchema = z
  .object({
    deviceType: z.enum(["celular", "laptop", "pc"]),
    brand: z.string().trim().min(1),
    model: z.string().trim().min(1),
    active: z.boolean(),
    repairs: z.array(z.object({ type: z.string().min(1), price: z.number().nonnegative() })),
  })
  .partial();

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await params;
  const entry = await RepairCatalog.findById(id).lean();
  if (!entry) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await params;
  const parsed = RepairCatalogUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const entry = await RepairCatalog.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!entry) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      return NextResponse.json(
        { error: "Ya existe una entrada para ese dispositivo/marca/modelo" },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/repair-catalog/[id]]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await params;
  const entry = await RepairCatalog.findByIdAndDelete(id);
  if (!entry) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ success: true });
}
