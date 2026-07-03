import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { getModels } from "@/lib/tenant-models";
import { z } from "zod";

const FavoriteSchema = z.object({ productId: z.string().min(1) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([]);

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const user = await User.findOne({ email: session.user.email })
    .select("favorites")
    .lean<{ favorites?: string[] }>();

  return NextResponse.json(user?.favorites ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const parsed = FavoriteSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    const { productId } = parsed.data;

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    const user = await User.findOne({ email: session.user.email }).select("favorites");
    if (!user)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const favorites: string[] = user.favorites ?? [];
    const already = favorites.includes(productId);

    if (already) {
      await User.updateOne({ _id: user._id }, { $pull: { favorites: productId } });
    } else {
      await User.updateOne({ _id: user._id }, { $addToSet: { favorites: productId } });
    }

    return NextResponse.json({ added: !already, productId });
  } catch (err) {
    console.error("[FAVORITES POST]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
