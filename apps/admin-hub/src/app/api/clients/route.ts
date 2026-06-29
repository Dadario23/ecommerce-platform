import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { CLIENT_DISPLAY_NAMES } from "@/config/clients";

// Lista de clientes registrados en la plataforma
// En el futuro esto puede venir de una colección "platform_clients"
const REGISTERED_CLIENTS = (process.env.PLATFORM_CLIENTS ?? "bitm-cel").split(",").map((s) => s.trim());

const CLUSTER_URI = process.env.MONGODB_CLUSTER_URI!;

async function getClusterConnection() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(CLUSTER_URI);
  return mongoose.connection;
}

async function getClientStats(conn: mongoose.Connection, dbName: string) {
  const db = conn.useDb(dbName, { useCache: true });

  const [orders, pendingOrders, membership, setting] = await Promise.all([
    db.collection("orders").countDocuments(),
    db.collection("orders").countDocuments({ status: { $in: ["pending", "confirmed", "processing"] } }),
    db.collection("memberships").findOne({}, { sort: { createdAt: -1 } }),
    db.collection("settings").findOne({}, { projection: { storeName: 1 } }),
  ]);

  const revenueResult = await db.collection("orders").aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]).toArray();

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyRevenueResult = await db.collection("orders").aggregate([
    { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: currentMonth } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]).toArray();

  return {
    slug: dbName,
    storeName: CLIENT_DISPLAY_NAMES[dbName] ?? (setting?.storeName as string | undefined) ?? dbName,
    orders: { total: orders, pending: pendingOrders },
    revenue: { total: revenueResult[0]?.total ?? 0, thisMonth: monthlyRevenueResult[0]?.total ?? 0 },
    membership: membership
      ? { status: membership.status, paidUntil: membership.paidUntil, lastPaymentDate: membership.lastPaymentDate }
      : { status: "active", paidUntil: null, lastPaymentDate: null },
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
