import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";

const PresupuestoSchema = z.object({
  cliente: z
    .object({
      nombre: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  equipo: z
    .object({
      tipo: z.string().optional(),
      marca: z.string().optional(),
      modelo: z.string().optional(),
    })
    .optional(),
  items: z.array(z.object({ repair: z.string(), price: z.string() })).default([]),
  esGenerico: z.boolean().optional(),
});

// Admin: list all
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const presupuestos = await Presupuesto.find()
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(presupuestos);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// Public: save from chatbot
export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const parsed = PresupuestoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de presupuesto inválidos" }, { status: 400 });
    }
    const data = parsed.data;

    const session = await getServerSession(authOptions);

    let userId: unknown = undefined;
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).lean<{ _id: unknown }>();
      if (user) userId = user._id;
    }

    const total = data.items
      .filter((i) => i.price !== "a consultar")
      .reduce((sum, i) => sum + parseFloat(i.price || "0"), 0);

    const pres = new Presupuesto({
      userId,
      cliente: {
        nombre: data.cliente?.nombre || "Sin nombre",
        email: data.cliente?.email || session?.user?.email,
      },
      equipo: {
        tipo: data.equipo?.tipo,
        marca: data.equipo?.marca || "",
        modelo: data.equipo?.modelo || "",
      },
      items: data.items || [],
      totalEstimado: total > 0 ? total : undefined,
      esGenerico: data.esGenerico ?? false,
    });

    await pres.save();
    return NextResponse.json({ id: pres._id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creando presupuesto:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
