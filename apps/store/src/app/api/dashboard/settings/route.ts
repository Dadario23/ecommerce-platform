import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";

async function getSettings() {
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const doc = await Setting.findOne().lean<{
    storeName: string; storeEmail: string; storePhone: string;
    storeDescription: string; shippingCost: number;
    freeShippingThreshold: number; instagramUrl: string;
    facebookUrl: string; whatsappNumber: string;
    shippingEnabled: boolean;
    modules_repairs: boolean; modules_budgets: boolean;
    modules_shipping: boolean; modules_coupons: boolean;
    modules_analytics: boolean;
    modules_sizes: boolean; modules_sizeGuide: boolean;
    modules_quantityDiscounts: boolean; modules_reels: boolean;
    modules_faq: boolean;
  }>();
  if (!doc) {
    const created = await Setting.create({});
    return (await Setting.findById(created._id).lean()) as typeof doc;
  }
  return doc;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const allowed = [
    "storeName", "storeEmail", "storePhone", "storeDescription",
    "shippingCost", "freeShippingThreshold",
    "instagramUrl", "facebookUrl", "whatsappNumber",
    "carouselImages", "homeFeaturedMode", "shippingEnabled",
    "modules_repairs", "modules_budgets", "modules_shipping",
    "modules_coupons", "modules_analytics",
    "modules_sizes", "modules_sizeGuide", "modules_quantityDiscounts",
    "modules_reels", "modules_faq",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const doc = await Setting.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, lean: true, strict: false },
  );
  return NextResponse.json(doc);
}
