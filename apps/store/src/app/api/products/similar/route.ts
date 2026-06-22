import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getModels } from "@/lib/tenant-models";

export async function GET(req: NextRequest) {
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const excludeId  = searchParams.get("excludeId");

  if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
    return NextResponse.json([]);
  }

  const query: Record<string, unknown> = {
    category: new mongoose.Types.ObjectId(categoryId),
    stock: { $gt: 0 },
    isActive: { $ne: false },
  };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const products = await Product.find(query)
    .sort({ featured: -1, avgRating: -1, createdAt: -1 })
    .limit(8)
    .select("name slug price compareAtPrice images avgRating reviewCount")
    .lean();

  return NextResponse.json(products);
}
