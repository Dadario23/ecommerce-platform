import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { CLIENT_DISPLAY_NAMES } from "@/config/clients";

const REGISTERED_CLIENTS = (process.env.PLATFORM_CLIENTS ?? "bitm-cel").split(",").map((s) => s.trim());
const CLUSTER_URI = process.env.MONGODB_CLUSTER_URI!;

async function getClusterConnection() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(CLUSTER_URI);
  return mongoose.connection;
}

async function getClientStats(conn: mongoose.Connection, dbName: string) {
  const db = conn.useDb(dbName, { useCache: true });

  const [membership, setting, productCount, orderCount, lastOrder] = await Promise.all([
    db.collection("memberships").findOne({}, { sort: { createdAt: -1 } }),
    db.collection("settings").findOne({}, {
      projection: {
        storeName: 1,
        modules_repairs: 1, modules_budgets: 1,
        modules_shipping: 1, modules_coupons: 1, modules_analytics: 1,
      },
    }),
    db.collection("products").countDocuments({ isActive: { $ne: false } }),
    db.collection("orders").countDocuments(),
    db.collection("orders").findOne({}, { sort: { createdAt: -1 }, projection: { createdAt: 1 } }),
  ]);

  const activeModules: string[] = [];
  if (setting?.modules_repairs)   activeModules.push("Soporte técnico");
  if (setting?.modules_budgets)   activeModules.push("Presupuestos");
  if (setting?.modules_shipping ?? true)  activeModules.push("Envíos");
  if (setting?.modules_coupons  ?? true)  activeModules.push("Cupones");
  if (setting?.modules_analytics ?? true) activeModules.push("Analíticas");

  return {
    slug: dbName,
    storeName: CLIENT_DISPLAY_NAMES[dbName] ?? (setting?.storeName as string | undefined) ?? dbName,
    membership: membership
      ? { status: membership.status as string, paidUntil: membership.paidUntil ?? null, lastPaymentDate: membership.lastPaymentDate ?? null }
      : { status: "active", paidUntil: null, lastPaymentDate: null },
    modules: activeModules,
    productCount,
    orderCount,
    lastOrderDate: (lastOrder?.createdAt as Date | undefined)?.toISOString() ?? null,
  };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_HUB_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await getClusterConnection();
    const stats = await Promise.all(REGISTERED_CLIENTS.map((db) => getClientStats(conn, db)));
    return NextResponse.json({ clients: stats });
  } catch (err) {
    console.error("[admin-hub] Error obteniendo stats:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_HUB_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientDb, action } = await req.json();
  if (!REGISTERED_CLIENTS.includes(clientDb)) {
    return NextResponse.json({ error: "Cliente no registrado" }, { status: 400 });
  }

  const conn = await getClusterConnection();
  const db = conn.useDb(clientDb, { useCache: true });
  const now = new Date();

  if (action === "activate") {
    const paidUntil = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const gracePeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    await db.collection("memberships").updateOne(
      {},
      { $set: { status: "active", paidUntil, gracePeriodEnd, lastPaymentDate: now, updatedAt: now } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, message: `${clientDb} activado` });
  }

  if (action === "suspend") {
    await db.collection("memberships").updateOne(
      {},
      { $set: { status: "suspended", updatedAt: now } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, message: `${clientDb} suspendido` });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
