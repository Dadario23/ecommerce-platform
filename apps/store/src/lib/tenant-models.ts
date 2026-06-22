import { connectTenantDB } from "@repo/tenant";
import { headers } from "next/headers";
import type mongoose from "mongoose";

// Importar cada modelo para registrar su schema en la conexión global
import GlobalCart from "@/models/Cart";
import GlobalCategory from "@/models/Category";
import GlobalCoupon from "@/models/Coupon";
import GlobalNotification from "@/models/Notification";
import GlobalOrder from "@/models/Order";
import GlobalPresupuesto from "@/models/Presupuesto";
import GlobalProduct from "@/models/Product";
import GlobalRepairCatalog from "@/models/RepairCatalog";
import GlobalReparacion from "@/models/Reparacion";
import GlobalReview from "@/models/Review";
import GlobalSetting from "@/models/Setting";
import GlobalShippingConfig from "@/models/ShippingConfig";
import GlobalUser from "@/models/User";

// Registra (o devuelve) el modelo en la conexión del tenant
function bind<T extends mongoose.Document>(
  conn: mongoose.Connection,
  global: mongoose.Model<T>
): mongoose.Model<T> {
  return (
    (conn.models[global.modelName] as mongoose.Model<T>) ??
    conn.model<T>(global.modelName, global.schema)
  );
}

export async function getModels() {
  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? process.env.TENANT_SLUG;
  if (!slug) throw new Error("Tenant no resuelto — falta x-tenant-slug o TENANT_SLUG");

  const conn = await connectTenantDB(slug);

  return {
    Cart: bind(conn, GlobalCart),
    Category: bind(conn, GlobalCategory),
    Coupon: bind(conn, GlobalCoupon),
    Notification: bind(conn, GlobalNotification),
    Order: bind(conn, GlobalOrder),
    Presupuesto: bind(conn, GlobalPresupuesto),
    Product: bind(conn, GlobalProduct),
    RepairCatalog: bind(conn, GlobalRepairCatalog),
    Reparacion: bind(conn, GlobalReparacion),
    Review: bind(conn, GlobalReview),
    Setting: bind(conn, GlobalSetting),
    ShippingConfig: bind(conn, GlobalShippingConfig),
    User: bind(conn, GlobalUser),
  };
}
