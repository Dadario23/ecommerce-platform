import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isReceptionist, isStaff } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isStaff(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const filter =
    session!.user.role === "technician"
      ? { assignedTo: session!.user.id }
      : {};

  const reparaciones = await Reparacion.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(reparaciones);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isReceptionist(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const data = await request.json();

  // El email va a una query: exigir string para evitar inyección de operadores
  if (data.cliente?.email !== undefined && typeof data.cliente.email !== "string") {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (data.cliente?.email) {
    const user = await User.findOne({ email: data.cliente.email }).lean<{ _id: unknown }>();
    if (user) data.userId = user._id;
  }

  const rep = new Reparacion(data);
  await rep.save();
  return NextResponse.json(rep, { status: 201 });
}
