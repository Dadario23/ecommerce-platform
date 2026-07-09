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

## Backups y restore

El cluster de Atlas es **M0 (gratis): Atlas no hace ningún backup**. El único
backup es el workflow `.github/workflows/backup.yml`: todos los días a las
03:00 (hora argentina) hace `mongodump` de cada DB del cluster y lo sube como
artifact del repo con 90 días de retención. Lista las DBs dinámicamente, así
que un tenant nuevo queda cubierto sin tocar nada.

- **RPO: hasta 24 h de pérdida** (un dump por día). Si en algún momento eso no
  alcanza, subir la frecuencia del cron o pasar el cluster a Flex/M10, que
  tienen backups propios de Atlas.
- Requiere el secret `MONGODB_CLUSTER_URI` en GitHub (repo → Settings →
  Secrets and variables → Actions) y que Atlas Network Access permita
  `0.0.0.0/0` (ya requerido por Vercel).
- GitHub avisa por email si el workflow falla (verificar en
  github.com/settings/notifications → Actions → "Failed workflows only").
- Ojo: GitHub **desactiva los crons tras 60 días sin actividad** en el repo;
  avisa por email antes. Un push cualquiera lo reactiva.

### Restore (simulacro hecho el 2026-07-09: dump 7 s, restore 5 s, 16/16 colecciones OK)

Herramientas: [mongodb-database-tools](https://www.mongodb.com/try/download/database-tools)
para `mongodump`/`mongorestore`; `mongosh` vía `npx -y mongosh`.

1. Descargar el backup: repo → Actions → workflow "Backup" → run del día →
   artifact `mongodb-backup-<fecha>`. Adentro hay un `<slug>.archive.gz` por tenant.
2. **Inspeccionar primero en una DB temporal** (no pisa nada):

   ```bash
   mongorestore --uri "$MONGODB_CLUSTER_URI" --archive=<slug>.archive.gz --gzip \
     --nsFrom='<slug>.*' --nsTo='restore-drill.*'
   ```

   Verificar conteos contra la DB viva:

   ```bash
   npx -y mongosh "$MONGODB_CLUSTER_URI" --quiet --eval '
   const src = db.getSiblingDB("<slug>"), dst = db.getSiblingDB("restore-drill");
   for (const c of src.getCollectionNames().sort())
     print(c, src.getCollection(c).countDocuments(), dst.getCollection(c).countDocuments());'
   ```

3. Restaurar el tenant de verdad (pisa la DB con el contenido del backup;
   `--drop` borra cada colección antes de recrearla — lo escrito después del
   dump se pierde):

   ```bash
   mongorestore --uri "$MONGODB_CLUSTER_URI" --archive=<slug>.archive.gz --gzip --drop
   ```

4. Limpiar la DB temporal:

   ```bash
   npx -y mongosh "$MONGODB_CLUSTER_URI" --quiet --eval 'db.getSiblingDB("restore-drill").dropDatabase()'
   ```

Cada tenant es una DB separada: restaurar uno no toca a los demás.
