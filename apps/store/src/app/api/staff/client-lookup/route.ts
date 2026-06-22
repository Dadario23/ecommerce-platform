import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { isStaff } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isStaff(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("name email phone addresses")
    .lean<{
      _id: unknown;
      name: string;
      email: string;
      phone?: string;
      addresses?: { phone?: string; isDefault?: boolean }[];
    }>();

  if (!user) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phone =
    user.phone ||
    user.addresses?.find((a) => a.isDefault)?.phone ||
    user.addresses?.[0]?.phone ||
    "";

  return NextResponse.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone,
  });
}
