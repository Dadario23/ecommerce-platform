import { NextResponse } from "next/server";
import crypto from "crypto";
import { CLIENT_DISPLAY_NAMES } from "@/config/clients";
import { REGISTERED_CLIENTS, getTenantDb } from "@/lib/tenants";
import { activateMembership, suspendMembership } from "@/lib/memberships";

// Comparación en tiempo constante: hashea ambos lados a 32 bytes fijos para no
// filtrar ni la longitud ni el contenido del secreto por timing.
function isAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_HUB_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("authorization") ?? "";
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(`Bearer ${secret}`).digest();
  return crypto.timingSafeEqual(a, b);
}

async function getClientStats(dbName: string) {
  const db = await getTenantDb(dbName);

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
      ? {
          status: membership.status as string,
          paidUntil: membership.paidUntil ?? null,
          lastPaymentDate: membership.lastPaymentDate ?? null,
          monthlyPrice: (membership.monthlyPrice as number | undefined) ?? null,
        }
      : { status: "active", paidUntil: null, lastPaymentDate: null, monthlyPrice: null },
    modules: activeModules,
    productCount,
    orderCount,
    lastOrderDate: (lastOrder?.createdAt as Date | undefined)?.toISOString() ?? null,
  };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await Promise.all(REGISTERED_CLIENTS.map((db) => getClientStats(db)));
    return NextResponse.json({ clients: stats });
  } catch (err) {
    console.error("[admin-hub] Error obteniendo stats:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientDb, action } = await req.json();
  if (!REGISTERED_CLIENTS.includes(clientDb)) {
    return NextResponse.json({ error: "Cliente no registrado" }, { status: 400 });
  }

  const db = await getTenantDb(clientDb);

  if (action === "activate") {
    await activateMembership(db);
    return NextResponse.json({ ok: true, message: `${clientDb} activado` });
  }

  if (action === "suspend") {
    await suspendMembership(db);
    return NextResponse.json({ ok: true, message: `${clientDb} suspendido` });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
