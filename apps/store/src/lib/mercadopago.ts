import { MercadoPagoConfig } from "mercadopago";
import { getTenantSecrets } from "@/lib/tenant-secrets";

// Cliente de MP con las credenciales del tenant activo. Se construye por
// request: el token depende del tenant y no puede vivir a nivel de módulo.
export async function getMpClient(): Promise<MercadoPagoConfig> {
  const { mpAccessToken } = await getTenantSecrets();
  return new MercadoPagoConfig({ accessToken: mpAccessToken });
}
