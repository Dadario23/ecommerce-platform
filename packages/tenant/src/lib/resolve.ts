// Resuelve un hostname al slug del tenant.
// TENANT_SLUG sobreescribe la resolución (útil en dev local).
// TENANT_DOMAINS formato: "bitm-cel.com.ar:bitm-cel,kameleba.com.ar:kameleba"
export function resolveTenant(host: string): string | null {
  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;

  const raw = process.env.TENANT_DOMAINS ?? "";
  if (!raw) return null;

  const hostname = host.split(":")[0];

  for (const entry of raw.split(",")) {
    const [domain, slug] = entry.trim().split(":");
    if (domain && slug && hostname === domain) return slug;
  }

  return null;
}
