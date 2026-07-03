import { getModels } from "@/lib/tenant-models";

export type RateLimitResult = { limited: boolean; retryAfterSec: number };

// IP del cliente a partir de las cabeceras (Vercel setea x-forwarded-for)
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function retryAfter(expiresAt: Date, now: Date): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
}

// Registra un intento y devuelve si se superó el límite dentro de la ventana.
// Usa un update por pipeline: incrementa si la ventana sigue activa, o reinicia
// el contador si ya venció — todo en una sola operación atómica.
export async function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const { RateLimit } = await getModels();
  const now = new Date();

  const run = () =>
    RateLimit.findOneAndUpdate(
      { key },
      [
        {
          $set: {
            count: {
              $cond: [{ $gt: ["$expiresAt", now] }, { $add: ["$count", 1] }, 1],
            },
            expiresAt: {
              $cond: [
                { $gt: ["$expiresAt", now] },
                "$expiresAt",
                new Date(now.getTime() + windowMs),
              ],
            },
          },
        },
      ],
      { upsert: true, new: true }
    );

  let doc;
  try {
    doc = await run();
  } catch (err) {
    // Carrera en el upsert sobre la clave única: reintentar una vez
    if ((err as { code?: number }).code === 11000) doc = await run();
    else throw err;
  }

  return { limited: doc!.count > limit, retryAfterSec: retryAfter(doc!.expiresAt, now) };
}

// Consulta el estado sin incrementar (para chequear antes de validar credenciales)
export async function peekRateLimit(key: string, limit: number): Promise<RateLimitResult> {
  const { RateLimit } = await getModels();
  const now = new Date();
  const doc = await RateLimit.findOne({ key });
  if (!doc || doc.expiresAt <= now) return { limited: false, retryAfterSec: 0 };
  return { limited: doc.count >= limit, retryAfterSec: retryAfter(doc.expiresAt, now) };
}

// Limpia el contador (p.ej. tras un login exitoso)
export async function resetRateLimit(key: string): Promise<void> {
  const { RateLimit } = await getModels();
  await RateLimit.deleteOne({ key });
}
