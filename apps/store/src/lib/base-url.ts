import { headers } from "next/headers";

const FALLBACK_URL =
  process.env.NEXT_PUBLIC_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

/**
 * URL base del tenant activo, derivada del host de la request.
 * Con un solo deployment para todos los tenants, una env var única
 * apuntaría siempre al mismo dominio; el host es la fuente de verdad.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return FALLBACK_URL;

  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto}://${host}`;
}
