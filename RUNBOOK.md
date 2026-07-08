# RUNBOOK.md — operación de la plataforma

> Procedimientos operativos del dueño de la plataforma. Qué hacer cuando algo
> falla y cómo está montado el monitoreo.

---

## Alertas operativas (email)

`lib/ops-alert.ts` envía un email al operador (`OPS_ALERT_EMAIL` en las env
vars de Vercel) cuando falla algo en el camino del dinero. Asunto siempre
`[ops:<tenant>] …`. Sin `OPS_ALERT_EMAIL` configurada, las alertas quedan
apagadas (no-op silencioso).

| Alerta | Qué significa | Qué hacer |
|--------|---------------|-----------|
| Webhook MP con firma inválida | Llegó un webhook con formato de MP que no pasó la HMAC. Un evento aislado puede ser ruido; repetido = secret mal configurado y **ningún pago se confirma** | Verificar `mpWebhookSecret` en el Setting del tenant (o `MP_WEBHOOK_SECRET` env) contra el panel de MP |
| Pago MP aprobado sin orden | MP cobró con una `external_reference` que no existe en la DB | Buscar el pago en el panel de MP del tenant, identificar al cliente, resolver manualmente |
| Falló el email de confirmación | El pago se confirmó pero el cliente no recibió el email | Revisar `RESEND_API_KEY` / `fromEmail` del tenant; reenviar manualmente si hace falta |
| Error procesando webhook MP | Excepción en el webhook. MP reintenta con backoff, pero si se repite hay pagos aprobados sin confirmar | Ver logs de Vercel del deployment activo; los reintentos de MP son idempotentes, se puede corregir y esperar el próximo |

## Monitoreo de uptime (pendiente de configurar — manual, ~15 min)

`GET /api/payments/webhook` responde `{"status":"webhook activo"}` sin auth:
sirve de health check de app + DB routing por dominio.

1. Crear cuenta gratis en https://uptimerobot.com
2. Un monitor HTTP por tenant, intervalo 5 min:
   - `https://bitm-cel.com.ar/api/payments/webhook`
   - `https://kameleba.com.ar/api/payments/webhook`
   - `https://www.compumobile.com.ar/api/payments/webhook`
3. Alert contact: el mismo email de `OPS_ALERT_EMAIL`

## Notificaciones de deploy (pendiente — manual, ~5 min)

En Vercel → proyecto store → Settings → Notifications: activar aviso por
email de **Deployment Failed**. Con el CI en verde un deploy no debería
fallar, pero el build de Vercel tiene sus propios modos de falla (env vars,
límites).

## Restore de backup (pendiente — se documenta con el simulacro del paso 4)
