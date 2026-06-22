import { NextResponse } from "next/server";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getModels } from "@/lib/tenant-models";

const SELECT_FIELDS =
  "name slug images price compareAtPrice brand stock condition shippingTypes freeShipping category avgRating reviewCount";

export async function GET(req: Request) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query")?.trim() ?? "";
    const mode = searchParams.get("mode") ?? "suggest";
    const sort = searchParams.get("sort") ?? "relevance";

    if (!query) return NextResponse.json([]);

    // Find categories whose name matches the query (e.g. "celular" → "Celulares")
    const matchedCategories = await Category.find({
      name: { $regex: query, $options: "i" },
    })
      .select("_id")
      .lean<{ _id: unknown }[]>();

    const categoryIds = matchedCategories.map((c) => c._id);

    // Base filter: always regex — works regardless of text indexes
    // Matches name, brand, or products in a matching category
    const filter = {
      isActive: { $ne: false },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        ...(categoryIds.length > 0 ? [{ category: { $in: categoryIds } }] : []),
      ],
    };

    // Sort
    type MongoSort = Record<string, 1 | -1>;
    const sortMap: Record<string, MongoSort> = {
      price_asc:  { freeShipping: -1, price: 1 },
      price_desc: { freeShipping: -1, price: -1 },
      newest:     { freeShipping: -1, createdAt: -1 },
      rating:     { freeShipping: -1, avgRating: -1, reviewCount: -1 },
    };
    const mongoSort: MongoSort = sortMap[sort] ?? { freeShipping: -1 };

    const limit = mode === "suggest" ? 6 : 0;

    const q = Product.find(filter).select(SELECT_FIELDS).sort(mongoSort);
    if (limit > 0) q.limit(limit);

    const products = await q.lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error("[SEARCH_API_ERROR]", error);
    return NextResponse.json({ error: "Error al buscar productos" }, { status: 500 });
  }
}
