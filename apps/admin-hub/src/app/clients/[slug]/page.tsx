import { notFound } from "next/navigation";
import { CLIENT_DISPLAY_NAMES } from "@/config/clients";
import { isRegisteredClient, getTenantDb } from "@/lib/tenants";
import { saveModules, saveCredentials, saveMonthlyPrice, registerPayment, suspendClient } from "./actions";
import { ModulesCard, type Modules } from "./modules-card";
import { CredentialsCard, type CredentialField } from "./credentials-card";
import { MembershipCard, type MembershipInfo } from "./membership-card";

const CREDENTIAL_FIELDS: { key: string; label: string; secret: boolean }[] = [
  { key: "mpAccessToken",   label: "MP Access Token",        secret: true },
  { key: "mpWebhookSecret", label: "MP Webhook Secret",      secret: true },
  { key: "fromEmail",       label: "Remitente de emails",    secret: false },
  { key: "transferAlias",   label: "Alias de transferencia", secret: false },
  { key: "transferCvu",     label: "CVU de transferencia",   secret: false },
  { key: "whatsappNumber",  label: "WhatsApp de contacto",   secret: false },
];

const BANNERS: Record<string, { text: string; ok: boolean }> = {
  "saved=modules": { text: "Módulos guardados.", ok: true },
  "saved=creds":   { text: "Credenciales actualizadas.", ok: true },
  "saved=price":   { text: "Precio guardado.", ok: true },
  "saved=payment": { text: "Pago registrado: activo hasta fin de mes.", ok: true },
  "saved=suspend": { text: "Cliente suspendido.", ok: true },
  "err=no-setting": { text: "Este cliente todavía no tiene Setting. Crealo desde el alta de clientes.", ok: false },
  "err=price":      { text: "Precio inválido: tiene que ser un número entre 0 y 10.000.000.", ok: false },
};

const mask = (v: string) => `${v.slice(0, 4)}…(${v.length})`;

async function getClientDetail(slug: string) {
  const db = await getTenantDb(slug);
  const [setting, membership] = await Promise.all([
    db.collection("settings").findOne({}, {
      projection: {
        storeName: 1,
        modules_repairs: 1, modules_budgets: 1,
        modules_shipping: 1, modules_coupons: 1, modules_analytics: 1,
        mpAccessToken: 1, mpWebhookSecret: 1, fromEmail: 1,
        transferAlias: 1, transferCvu: 1, whatsappNumber: 1,
      },
    }),
    db.collection("memberships").findOne({}, { sort: { createdAt: -1 } }),
  ]);

  const modules: Modules = {
    modules_repairs:   Boolean(setting?.modules_repairs ?? false),
    modules_budgets:   Boolean(setting?.modules_budgets ?? false),
    modules_shipping:  Boolean(setting?.modules_shipping ?? true),
    modules_coupons:   Boolean(setting?.modules_coupons ?? true),
    modules_analytics: Boolean(setting?.modules_analytics ?? true),
  };

  const credentials: CredentialField[] = CREDENTIAL_FIELDS.map(({ key, label, secret }) => {
    const value = typeof setting?.[key] === "string" ? (setting[key] as string) : "";
    return {
      key,
      label,
      current: value === "" ? "(vacío → fallback env)" : secret ? mask(value) : value,
    };
  });

  const rawStatus = membership?.status;
  const membershipInfo: MembershipInfo = {
    status: rawStatus === "suspended" || rawStatus === "grace" ? rawStatus : "active",
    paidUntil: (membership?.paidUntil as Date | undefined) ?? null,
    lastPaymentDate: (membership?.lastPaymentDate as Date | undefined) ?? null,
    monthlyPrice: typeof membership?.monthlyPrice === "number" ? membership.monthlyPrice : null,
  };

  return {
    storeName: CLIENT_DISPLAY_NAMES[slug] ?? (setting?.storeName as string | undefined) ?? slug,
    settingExists: setting !== null,
    modules,
    credentials,
    membership: membershipInfo,
  };
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; err?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isRegisteredClient(slug)) notFound();

  const data = await getClientDetail(slug);
  const bannerKey = query.saved ? `saved=${query.saved}` : query.err ? `err=${query.err}` : null;
  const banner = bannerKey ? BANNERS[bannerKey] : undefined;

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <a href="/" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "16px 0 4px" }}>
        {data.storeName}
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Slug: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{slug}</code>
      </p>

      {banner && (
        <div
          style={{
            background: banner.ok ? "#dcfce7" : "#fee2e2",
            color: banner.ok ? "#166534" : "#991b1b",
            border: `1px solid ${banner.ok ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, marginBottom: 24,
          }}
        >
          {banner.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <MembershipCard
          membership={data.membership}
          priceAction={saveMonthlyPrice.bind(null, slug)}
          paymentAction={registerPayment.bind(null, slug)}
          suspendAction={suspendClient.bind(null, slug)}
        />

        <ModulesCard modules={data.modules} action={saveModules.bind(null, slug)} />

        {data.settingExists ? (
          <CredentialsCard fields={data.credentials} action={saveCredentials.bind(null, slug)} />
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Credenciales</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Este cliente todavía no tiene Setting.{" "}
              <a href="/clients/new" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                Crealo desde el alta de clientes →
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
