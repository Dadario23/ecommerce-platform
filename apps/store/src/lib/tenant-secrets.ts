import { getModels } from "@/lib/tenant-models";

export type TenantSecrets = {
  mpAccessToken: string;
  mpWebhookSecret: string;
  fromEmail: string;
  transferAlias: string;
  transferCvu: string;
};

// Credenciales e identidad de pago/email del tenant activo, leídas de su
// Setting. Mientras un tenant no tenga los campos cargados, caen a las env
// vars globales (comportamiento previo). Nunca exponer esto al cliente.
export async function getTenantSecrets(): Promise<TenantSecrets> {
  const { Setting } = await getModels();
  const s = await Setting.findOne()
    .select("mpAccessToken mpWebhookSecret fromEmail transferAlias transferCvu")
    .lean<Partial<TenantSecrets>>();

  return {
    mpAccessToken: s?.mpAccessToken || process.env.MP_ACCESS_TOKEN || "",
    mpWebhookSecret: s?.mpWebhookSecret || process.env.MP_WEBHOOK_SECRET || "",
    fromEmail: s?.fromEmail || process.env.FROM_EMAIL || "",
    transferAlias: s?.transferAlias || process.env.MP_ALIAS || "",
    transferCvu: s?.transferCvu || process.env.MP_CVU || "",
  };
}
