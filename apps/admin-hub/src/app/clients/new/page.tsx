// Nota: la ruta estática /clients/new gana sobre /clients/[slug], así que un
// tenant llamado "new" sería inaccesible — no usar ese slug.
import { REGISTERED_CLIENTS, getTenantDb } from "@/lib/tenants";
import { createTenantSetting } from "./actions";

const MODULE_DEFAULTS: { key: string; label: string; defaultChecked: boolean }[] = [
  { key: "modules_repairs",   label: "Soporte técnico", defaultChecked: false },
  { key: "modules_budgets",   label: "Presupuestos",    defaultChecked: false },
  { key: "modules_shipping",  label: "Envíos",          defaultChecked: true },
  { key: "modules_coupons",   label: "Cupones",         defaultChecked: true },
  { key: "modules_analytics", label: "Analíticas",      defaultChecked: true },
  { key: "modules_sizes",             label: "Talles y variantes",      defaultChecked: false },
  { key: "modules_sizeGuide",         label: "Guía de talles",          defaultChecked: false },
  { key: "modules_quantityDiscounts", label: "Descuentos por cantidad", defaultChecked: false },
  { key: "modules_reels",             label: "Reels",                   defaultChecked: false },
  { key: "modules_faq",               label: "Preguntas frecuentes",    defaultChecked: false },
];

const CREDENTIAL_FIELDS: { key: string; label: string }[] = [
  { key: "mpAccessToken",   label: "MP Access Token" },
  { key: "mpWebhookSecret", label: "MP Webhook Secret" },
  { key: "fromEmail",       label: "Remitente de emails" },
  { key: "transferAlias",   label: "Alias de transferencia" },
  { key: "transferCvu",     label: "CVU de transferencia" },
  { key: "whatsappNumber",  label: "WhatsApp de contacto" },
];

const REMAINING_STEPS = [
  "Agregar el tema en apps/store/src/config/tenant-themes.ts y el display name en apps/admin-hub/src/config/clients.ts (commit + push).",
  "TENANT_DOMAINS en Vercel: rm + add con el valor completo (es sensitive, no se puede editar; el matching de hostname es exacto — apex y www).",
  "Apuntar el dominio a Vercel (Domains del proyecto; apex con redirect 308 al canónico).",
  "vercel redeploy del deployment de producción (el build snapshotea las env vars al inicio).",
  "Configurar el webhook de Mercado Pago en el panel del cliente y cargar el mpWebhookSecret desde el detalle del cliente.",
  "Crear o reanudar el monitor de UptimeRobot (receta en RUNBOOK.md).",
];

const ERRORS: Record<string, string> = {
  slug:   "Slug inválido o no registrado en PLATFORM_CLIENTS.",
  name:   "El nombre de la tienda es obligatorio (máximo 100 caracteres).",
  exists: "Ese cliente ya tiene Setting: no se pisa el seed existente.",
};

async function getPendingSlugs(): Promise<string[]> {
  const checks = await Promise.all(
    REGISTERED_CLIENTS.map(async (slug) => {
      const db = await getTenantDb(slug);
      const setting = await db.collection("settings").findOne({}, { projection: { _id: 1 } });
      return setting === null ? slug : null;
    })
  );
  return checks.filter((s): s is string => s !== null);
}

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const, border: "1px solid #cbd5e1",
  borderRadius: 6, padding: "8px 10px", fontSize: 13,
};

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 };

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; err?: string }>;
}) {
  const query = await searchParams;
  const pending = await getPendingSlugs();
  const error = query.err ? ERRORS[query.err] : undefined;

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <a href="/" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "16px 0 4px" }}>
        Alta de cliente
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Crea el documento Setting inicial en la DB del tenant (el paso 2 de CLIENT-ONBOARDING.md).
      </p>

      {query.created && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#166534" }}>
            Setting de <code>{query.created}</code> creado. Pasos manuales restantes:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {REMAINING_STEPS.map((step) => (
              <li key={step} style={{ fontSize: 13, color: "#166534" }}>{step}</li>
            ))}
          </ol>
          <p style={{ margin: "12px 0 0", fontSize: 13 }}>
            <a href={`/clients/${query.created}`} style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
              Ir al detalle de {query.created} →
            </a>
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
            Todos los clientes de <code>PLATFORM_CLIENTS</code> ya tienen Setting. Para dar de alta uno
            nuevo, primero agregá el slug a <code>PLATFORM_CLIENTS</code> en el <code>.env.local</code> del
            admin-hub y reiniciá el servidor.
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
          <form action={createTenantSetting} autoComplete="off">
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="slug" style={labelStyle}>Cliente (slug sin Setting)</label>
              <select id="slug" name="slug" required style={{ ...inputStyle, background: "#fff" }}>
                {pending.map((slug) => (
                  <option key={slug} value={slug}>{slug}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="storeName" style={labelStyle}>Nombre de la tienda</label>
              <input id="storeName" type="text" name="storeName" required maxLength={100} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Módulos</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MODULE_DEFAULTS.map(({ key, label, defaultChecked }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#0f172a", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name={key}
                      defaultChecked={defaultChecked}
                      style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <p style={{ ...labelStyle, marginBottom: 2 }}>Credenciales (opcionales)</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px" }}>
                Se pueden cargar después desde el detalle del cliente. Vacío = usa el fallback de env vars.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CREDENTIAL_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label htmlFor={key} style={{ ...labelStyle, fontWeight: 500, marginBottom: 4 }}>{label}</label>
                    <input id={key} type="text" name={key} autoComplete="off" style={{ ...inputStyle, fontFamily: "monospace" }} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                background: "#2563eb", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 24px", fontSize: 14,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Crear Setting
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
