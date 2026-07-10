# Alta de un nuevo cliente

Checklist completo para sumar un tenant a la plataforma. No se crea ninguna
app ni deployment nuevo: todo es configuración sobre `apps/store`.

Procedimiento probado end-to-end con el alta de `compumobile` (2026-07-04).

---

## Qué necesitás antes de empezar

| Insumo | Detalle | Quién lo provee |
|--------|---------|-----------------|
| **Slug** | Identificador único en minúsculas (ej: `kameleba`). Es también el nombre de la DB en Atlas — no se puede cambiar después sin migrar. | Vos |
| **Dominio propio** | Comprado y con acceso al panel del registrador. Los `.com.ar` se compran en [nic.ar](https://nic.ar) — Vercel no los vende. Decidir si el sitio canónico es apex (`dominio.com.ar`) o `www`. | Cliente |
| **Cuenta Mercado Pago** | Access Token de **producción** de la cuenta del cliente + Webhook Secret (se genera al configurar el webhook en el panel de MP, paso 7). | Cliente |
| **Email remitente** | Dirección para emails transaccionales. El dominio debe estar verificado en Resend; si no, queda el fallback `FROM_EMAIL` global. | Cliente |
| **Datos de cobro por transferencia** | Alias y CVU (si va a aceptar transferencias). | Cliente |
| **WhatsApp de contacto** | Número para el botón de contacto de la tienda. | Cliente |
| **Branding** | Colores (primary/hover/onPrimary/tint/accent), logo (PNG/SVG) o wordmark, favicon, tipografía, variante de home (`tech` o `editorial`). | Cliente + vos |
| **Módulos contratados** | Cuáles activa: `repairs`, `budgets`, `shipping`, `coupons`, `analytics`. | Acuerdo comercial |

---

## Paso 1 — Código (2 archivos + env local)

1. `apps/store/src/config/tenant-themes.ts` — agregar la entrada `<slug>` con
   el `TenantTheme` completo (storeName, colors, radius, font, logo, favicon,
   navStyle, cardStyle, homeVariant, benefits, promoItems).
2. `apps/admin-hub/src/config/clients.ts` — agregar el nombre display en
   `CLIENT_DISPLAY_NAMES`.
3. `apps/admin-hub/.env.local` — agregar el slug a `PLATFORM_CLIENTS`
   (y en las env de Vercel de admin-hub si algún día se deploya).

Commitear y pushear (el deploy automático todavía no sirve el dominio, no pasa nada).

## Paso 2 — DB y Setting inicial

- La DB `<slug>` se crea sola con la primera escritura — **no** hace falta
  crearla a mano en Atlas.
- Crear el `Setting` inicial desde el admin-hub: `localhost:3100/clients/new`
  (el wizard lista los slugs de `PLATFORM_CLIENTS` que aún no tienen Setting
  y siembra storeName + módulos + credenciales opcionales con los defaults
  del schema). Requiere haber hecho el paso 1 y reiniciado el admin-hub.
- Después del alta, los módulos se gestionan desde el detalle del cliente
  (`/clients/<slug>` → toggles).

## Paso 3 — Credenciales del tenant

Desde el admin-hub: detalle del cliente (`/clients/<slug>`) → card
"Credenciales". Campo vacío conserva el valor actual, `-` lo vacía (→ usa el
fallback de env vars globales). Los secrets se muestran enmascarados.

Alternativa CLI equivalente:

```bash
node apps/admin-hub/scripts/seed-tenant-secrets.mjs <slug>
```

## Paso 4 — `TENANT_DOMAINS` en Vercel

El matching de hostname es **EXACTO**: si el sitio se usa con y sin `www`,
las dos entradas tienen que estar.

```bash
vercel env rm TENANT_DOMAINS production --yes
printf '<valor-completo-con-todos-los-tenants>' | vercel env add TENANT_DOMAINS production
```

⚠️ La variable es de tipo *sensitive*: `vercel env pull` y la API la muestran
**vacía** aunque tenga valor. No existe "editar" — siempre rm + add con el
valor completo (todos los tenants, no solo el nuevo).

Formato: `dominio.com.ar:<slug>,www.dominio.com.ar:<slug>,...`

## Paso 5 — Apuntar el dominio a Vercel

- **Dominio nuevo (registrador externo):** agregarlo al proyecto
  `ecommerce-platform` en Vercel (Domains) y seguir las instrucciones de
  DNS (A/CNAME o delegar nameservers a Vercel). Agregar apex **y** www;
  configurar el apex con redirect 308 al www (o al revés, según el canónico).
- **Dominio que viene de otro proyecto Vercel del mismo team:** moverlo por
  API respetando el orden — 1) DELETE apex del proyecto viejo (si redirige
  al www, bloquea el delete del www), 2) DELETE www, 3) POST www al proyecto
  nuevo, 4) POST apex con `{"redirect":"www...","redirectStatusCode":308}`.

## Paso 6 — Redeploy y verificación

⚠️ El build snapshotea las env vars **al inicio**: cualquier deploy que haya
arrancado antes del paso 4 va a dar 404 en el dominio nuevo.

```bash
vercel redeploy <url-del-deployment-de-producción>
```

Verificar:

```bash
curl -s https://<dominio>/ | grep -o 'data-store-name="[^"]*"'   # tema correcto
curl -s https://<dominio>/ | grep -o 'data-module-repairs'        # lee el Setting de la DB (default false)
curl -s https://<dominio>/api/payments/webhook                    # {"status":"webhook activo"}
```

## Paso 7 — Webhook de Mercado Pago

En el panel de MP **del cliente** → Webhooks: crear la notificación de pagos
apuntando a `https://<dominio-canónico>/api/payments/webhook`. Copiar el
secret que genera MP y cargarlo como `mpWebhookSecret` (paso 3, se puede
re-correr el script tocando solo ese campo).

## Paso 8 — Monitoreo

Crear el monitor de uptime en UptimeRobot (HTTP, 5 min) a
`https://<dominio-canónico>/api/payments/webhook`. Receta de la API v3 en
`RUNBOOK.md` → "Monitoreo de uptime". Si el monitor ya existía pausado
(dominio comprado después), solo reanudarlo.

## Paso 9 (opcional) — Migración de datos desde una tienda vieja

Si el cliente ya tenía una tienda con el schema del store, la copia es
directa preservando `_id`s (mantiene integridad orders↔users↔products y los
hashes bcrypt siguen sirviendo). Excepciones:

- `settings` se **fusiona** (legacy como base + `modules_*` del tenant), no se copia.
- Usuario ya registrado en la tienda nueva con el mismo email → reemplazar
  su doc por el del legacy (cambia el `_id` ⇒ debe volver a loguearse).
- Verificar antes de borrar el origen: conteo por colección + muestreo de `_id`s.

El backup diario (`.github/workflows/backup.yml`) incluye la DB nueva
automáticamente — lista todas las DBs del cluster.
