import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Presupuesto from "@/models/Presupuesto";
import User from "@/models/User";
import { getModels } from "@/lib/tenant-models";

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
    const data = await request.json();

    const session = await getServerSession(authOptions);

    let userId: unknown = undefined;
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).lean<{ _id: unknown }>();
      if (user) userId = user._id;
    }

    const total = (data.items as { repair: string; price: string }[])
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
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
