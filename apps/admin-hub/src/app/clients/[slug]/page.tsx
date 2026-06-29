import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { CLIENT_DISPLAY_NAMES } from "@/config/clients";

const REGISTERED_CLIENTS = (process.env.PLATFORM_CLIENTS ?? "bitm-cel").split(",").map((s) => s.trim());
const CLUSTER_URI = process.env.MONGODB_CLUSTER_URI!;

type Modules = {
  modules_repairs: boolean;
  modules_budgets: boolean;
  modules_shipping: boolean;
  modules_coupons: boolean;
  modules_analytics: boolean;
};

const MODULE_LIST: { key: keyof Modules; label: string; description: string }[] = [
  { key: "modules_repairs",   label: "Soporte técnico",  description: "Gestión de reparaciones y presupuestos" },
  { key: "modules_budgets",   label: "Presupuestos",     description: "Módulo de presupuestos independiente" },
  { key: "modules_shipping",  label: "Envíos",           description: "Cálculo y gestión de envíos" },
  { key: "modules_coupons",   label: "Cupones",          description: "Descuentos con código de cupón" },
  { key: "modules_analytics", label: "Analíticas",       description: "Reportes y métricas de la tienda" },
];

async function getClientModules(slug: string): Promise<{ storeName: string } & Modules> {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(CLUSTER_URI);
  }
  const db = mongoose.connection.useDb(slug, { useCache: true });
  const doc = await db.collection("settings").findOne({}, {
    projection: {
      storeName: 1,
      modules_repairs: 1, modules_budgets: 1,
      modules_shipping: 1, modules_coupons: 1, modules_analytics: 1,
    },
  });
  return {
    storeName:         CLIENT_DISPLAY_NAMES[slug] ?? (doc?.storeName as string | undefined) ?? slug,
    modules_repairs:   Boolean(doc?.modules_repairs ?? false),
    modules_budgets:   Boolean(doc?.modules_budgets ?? false),
    modules_shipping:  Boolean(doc?.modules_shipping ?? true),
    modules_coupons:   Boolean(doc?.modules_coupons ?? true),
    modules_analytics: Boolean(doc?.modules_analytics ?? true),
  };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!REGISTERED_CLIENTS.includes(slug)) notFound();

  const data = await getClientModules(slug);

  async function saveModules(formData: FormData) {
    "use server";
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(CLUSTER_URI);
    }
    const db = mongoose.connection.useDb(slug, { useCache: true });
    await db.collection("settings").updateOne(
      {},
      {
        $set: {
          modules_repairs:   formData.get("modules_repairs") === "on",
          modules_budgets:   formData.get("modules_budgets") === "on",
          modules_shipping:  formData.get("modules_shipping") === "on",
          modules_coupons:   formData.get("modules_coupons") === "on",
          modules_analytics: formData.get("modules_analytics") === "on",
        },
      },
      { upsert: true }
    );
    revalidatePath(`/clients/${slug}`);
    redirect(`/clients/${slug}?saved=1`);
  }

  const saved = false; // handled via query param in real flow

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <a href="/" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "16px 0 4px" }}>
        {data.storeName}
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        Slug: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{slug}</code>
      </p>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Módulos activos</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
          Activá o desactivá funcionalidades para este cliente. Los cambios se aplican de inmediato en su tienda.
        </p>

        <form action={saveModules}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {MODULE_LIST.map(({ key, label, description }) => (
              <label
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{description}</p>
                </div>
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={data[key]}
                  style={{ width: 18, height: 18, accentColor: "#2563eb", cursor: "pointer", flexShrink: 0 }}
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            style={{
              background: "#2563eb", color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 24px", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Guardar módulos
          </button>
        </form>
      </div>
    </main>
  );
}
