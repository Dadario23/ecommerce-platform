import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "superadmin";
}

// GET: listar productos con filtros
export async function GET(request: Request) {
  try {
    // 1. Conectar a la base de datos
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    // 2. INICIALIZAR MODELOS - ESTO ES CLAVE

    // 3. Construir query
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const session = await getServerSession(authOptions);

    const query: Record<string, unknown> = {};
    if (categorySlug) query.category = categorySlug;

    // Admins ven todos los productos; la tienda pública solo ve los activos
    if (!isAdmin(session?.user?.role)) {
      query.isActive = { $ne: false };
    }

    // 4. Ejecutar consulta con populate
    const products = await Product.find(query)
      .populate("category", "name") // 👈 Ahora debería funcionar
      .sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 },
    );
  }
}

// POST: crear producto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const body = await req.json();

    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: "Nombre y precio son obligatorios" },
        { status: 400 },
      );
    }

    // 👇 forzamos que category se guarde como ObjectId
    if (body.category) {
      body.category = new mongoose.Types.ObjectId(body.category);
    }
    const product = await Product.create(body);
    const populated = await product.populate("category", "name");

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 },
    );
  }
}
