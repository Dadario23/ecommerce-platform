import { Resend } from "resend";
import { headers } from "next/headers";

// Alerta operativa al dueño de la PLATAFORMA (no al tenant): fallos en el
// camino del dinero que de otro modo mueren silenciosos en los logs.
// Usa las env vars del operador (RESEND_API_KEY/FROM_EMAIL), nunca las
// credenciales del tenant. Sin OPS_ALERT_EMAIL configurado es un no-op.
// Una alerta jamás rompe ni demora el flujo que la emite.
export async function sendOpsAlert(subject: string, lines: string[]): Promise<void> {
  try {
    const to = process.env.OPS_ALERT_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (!to || !apiKey || !from) return;

    let tenant = "desconocido";
    try {
      tenant = (await headers()).get("x-tenant-slug") ?? "desconocido";
    } catch {
      // fuera de contexto de request
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `[ops:${tenant}] ${subject}`,
      text: [`Tenant: ${tenant}`, `Fecha: ${new Date().toISOString()}`, "", ...lines].join("\n"),
    });
  } catch (err) {
    console.error("[ops-alert] no se pudo enviar la alerta:", err);
  }
}
