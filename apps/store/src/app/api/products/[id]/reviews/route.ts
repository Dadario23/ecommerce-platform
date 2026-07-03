import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { id } = await context.params;

  const productId = new mongoose.Types.ObjectId(id);
  const reviews = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(reviews);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const parsed = ReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Reseña inválida (rating 1-5, título y comentario requeridos)" },
        { status: 400 }
      );
    }
    const { rating, title, body } = parsed.data;

    if (!session.user.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ error: "Sesión inválida, volvé a iniciar sesión" }, { status: 401 });
    }

    const productId = new mongoose.Types.ObjectId(id);
    const product = await Product.findById(productId).lean<{ _id: mongoose.Types.ObjectId }>();
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const userEmail = session.user.email ?? "";
    const hasPurchased = await Order.exists({
      customerEmail: userEmail,
      "payment.status": "completed",
      "items.productId": productId,
    });

    const review = await Review.create({
      productId,
      userId: session.user.id,
      authorName: session.user.name ?? "Usuario",
      rating,
      title: title.trim(),
      body: body.trim(),
      verified: !!hasPurchased,
    });

    const stats = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        avgRating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; message?: string };
    if (mongoErr.code === 11000) {
      return NextResponse.json(
        { error: "Ya escribiste una reseña para este producto" },
        { status: 409 }
      );
    }
    console.error("[POST /api/products/[id]/reviews]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
