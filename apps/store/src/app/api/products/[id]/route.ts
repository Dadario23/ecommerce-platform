import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "superadmin";
}

// función para generar slug
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// GET: obtener producto por ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const product = await Product.findById(id).populate("category", "name");

  if (!product) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}

// DELETE: eliminar producto
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}

// PATCH: actualización parcial (quick-edit desde el dashboard)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    if (body == null || typeof body !== "object" || Object.keys(body).some((k) => k.startsWith("$"))) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: false }
    ).populate("category", "name");

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error al actualizar producto (PATCH):", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// PUT: actualizar producto
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    if (body == null || typeof body !== "object" || Object.keys(body).some((k) => k.startsWith("$"))) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    if (body.name) {
      body.slug = slugify(body.name);
    }

    if (body.category) {
      body.category = new mongoose.Types.ObjectId(body.category);
    }

    const product = await Product.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("category", "name");

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error al actualizar producto (PUT):", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}
