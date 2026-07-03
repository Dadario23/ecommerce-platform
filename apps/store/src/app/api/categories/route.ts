// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]).optional(),
  thumbnail: z.string().optional(),
  bannerImage: z.string().optional(),
});

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "superadmin";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const parsed = CategoryCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de categoría inválidos" }, { status: 400 });
    }
    const { name, description, status, thumbnail, bannerImage } = parsed.data;

    const category = await Category.create({
      name,
      description,
      status,
      thumbnail,
      bannerImage,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
