# ARCHITECTURE.md — ecommerce-platform

> Cómo está construido el sistema y por qué. Pseudocódigo solamente — el código
> real vive en el repo y esta doc no debe duplicarlo.
>
> **Docs relacionadas:**
> - Qué hace el producto → [PRD.md](./PRD.md)
> - Tokens y patrones de UI → [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
> - Reglas de trabajo → [CLAUDE.md](./CLAUDE.md)

---

## Principios

1. **Un solo deployment** — `apps/store` sirve a todos los tenants; escalar a 40+ clientes no crea apps ni deployments nuevos
2. **DB por tenant en cluster compartido** — el slug del tenant ES el nombre de su base en Atlas
3. **Server-first** — datos en Server Components; el cliente solo interactividad
4. **Validar dos veces** — schema (Mongoose) y boundary (Zod)
5. **Aislamiento de tenants** — el store nunca lee ni escribe la DB de otro tenant; solo admin-hub cruza tenants
6. **Fallar hacia el servicio** — ante un error nuestro (lectura de membresía, config), la tienda sigue operando

---

## Multi-tenant

```
bitm-cel.com.ar ──┐
kameleba.com.ar ──┤─▶ apps/store (Vercel, único deployment)
www.compumobile.com.ar ─┘        │
                                 ▼
                     middleware (edge) → resolveTenant(host)
                       · prod: TENANT_DOMAINS "dominio:slug,…" (match exacto de hostname)
                       · dev:  TENANT_SLUG en .env.local
                                 │  header x-tenant-slug
                                 ▼
                     connectTenantDB(slug)  →  mongoose.createConnection(cluster).useDb(slug)
                       · una conexión cacheada por slug (sobrevive entre requests serverless)
```

### Acceso a datos en store: `getModels()`

Los schemas se definen una sola vez en `apps/store/src/models/` y se **bindean**
a la conexión del tenant activo en cada request:

```pseudocode
// lib/tenant-models.ts
FUNCTION getModels():
  conn = await connectTenantDB(slugDelRequest)
  RETURN { Product: bind(conn, GlobalProduct), Order: ..., User: ..., … }
```

Regla dura: **nunca** usar un modelo global directo ni `connectDB()` en store —
escribe fuera de la DB del tenant. Los imports de `@/models/*` en rutas son solo
para tipos (`import type`).

### Patrón admin-hub (y solo admin-hub)

```pseudocode
clusterConn = mongoose.createConnection(MONGODB_CLUSTER_URI)
db = clusterConn.useDb(slug)     // slug ∈ PLATFORM_CLIENTS
```

- Auth: bearer estático `ADMIN_HUB_SECRET` comparado con `timingSafeEqual` en toda ruta API
- Es la única app que escribe `memberships`
- Los scripts de operador (`apps/admin-hub/scripts/`) usan este mismo patrón

### Configuración por tenant

Cada tenant tiene un doc `Setting` (singleton) en su DB:

| Grupo | Campos | Se lee con |
|-------|--------|-----------|
| Identidad | storeName, storeEmail, whatsappNumber, redes | `getClientConfig()` |
| Módulos | modules_repairs, modules_budgets, modules_shipping, modules_coupons | `getClientConfig()` |
| Credenciales | mpAccessToken, mpWebhookSecret, fromEmail, transferAlias, transferCvu | `getTenantSecrets()` — fallback a env vars si están vacías |

El theming NO vive en Setting: es estático por tenant en
`config/tenant-themes.ts` (ver DESIGN_SYSTEM.md). La URL pública se deriva del
host del request con `getBaseUrl()` (`lib/base-url.ts`) — nunca de una env var
única, que rompería el multi-tenant en links de MP y emails.

### Membresías

- Colección `memberships` en la DB de cada tenant; **admin-hub escribe, store lee**
- `evaluateMembership()`: sin doc = activo; `paidUntil` vencido corre gracia
  hasta `gracePeriodEnd` (o día 15 si falta el campo); después, suspendido
- `layout.tsx` corta el storefront solo con `suspended`; error de lectura = activo

---

## Autenticación y roles (store)

- NextAuth v4, estrategia JWT; credentials (email/password) + Google OAuth
- Rate limiting respaldado en MongoDB (`lib/rate-limit.ts`): login por email;
  register/forgot/reset por IP
- Roles (`lib/roles.ts`): `user` → cuenta y compras; `receptionist` → alta de
  reparaciones; `technician` → sus reparaciones asignadas; `admin`/`superadmin` → todo
- Toda ruta `/api` valida sesión (o rol) antes de procesar; el rol se lee de la
  sesión del server, jamás del payload

---

## Diseño de API

```pseudocode
FUNCTION handler(request):
  sesión/rol → 401/403 si no corresponde
  body = ZodSchema.safeParse(...)   → 400 si falla
  … lógica con getModels() …
CATCH:
  log server-side, responder mensaje genérico (nunca error.message al cliente)
```

- Schemas Zod inline por ruta; objetivo: tipos correctos + cerrar inyección de
  operadores NoSQL (`{$ne:…}` en un findOne)
- Modelos ricos admin-only (product PUT, presupuesto PATCH): en vez de enumerar
  todo el schema, **guard de operadores** — rechazar body con claves `$…`
- Nunca exponer `_id` crudo → mapear a `id` string

---

## Checkout, stock y pagos

Tres métodos de pago comparten `lib/checkout.ts` (`createCheckoutOrder()` +
schemas Zod): **Mercado Pago** (redirect), **transferencia** (alias/CVU del
tenant) y **contraentrega**.

### Reserva de stock (`lib/stock.ts`)

```pseudocode
reserveStock: por ítem, findOneAndUpdate({stock ≥ qty}, {$inc: -qty})  // atómico
              si una línea falla → rollback de las anteriores
```

- Contraentrega/transferencia: descuenta al crear la orden
- MP: reserva al crear la preferencia (`Order.stockReserved: true`);
  preferencia expira a los 30 min < reserva 45 min (margen para pagos sobre la hora)
- Reservas vencidas se liberan **lazy** al iniciar el próximo checkout
  (`releaseExpiredReservations`) — sin cron
- Cancelar (user o admin) → `restoreOnCancel`: devuelve stock y cupón según qué
  se haya contabilizado; des-cancelar (admin) → `redeductOnUncancel`, espejo con
  reserva atómica (409 si ya no hay stock)

### Mercado Pago

- Credenciales **por tenant** vía `getTenantSecrets()`; `getMpClient()` por request
- Con cupón, MP cobra un ítem único con el total (Checkout Pro no admite precios
  negativos); el descuento se recalcula server-side, nunca se confía en el cliente
- Webhook: firma HMAC-SHA256 con `timingSafeEqual` (hash de ambos lados para fijar
  longitud) + **claim idempotente** con findOneAndUpdate sobre `payment.status`
  — el mismo evento puede llegar N veces y se procesa una
- `usedCount` del cupón se incrementa recién al aprobarse el pago

---

## Email y media

- **Resend**, solo server-side; remitente por tenant (`fromEmail` del Setting,
  fallback `FROM_EMAIL`); los builders de emails reciben `storeUrl` derivada del host
- **Cloudinary**: upload vía `POST /api/upload` (admin-only, FormData); el server
  valida tipo/tamaño/carpeta y sube por stream — el cliente nunca sube directo.
  Transformaciones por URL en render (`quality auto`, `fetch_format auto`)

---

## Seguridad transversal

- Headers en `next.config.ts` de ambas apps (HSTS, nosniff, CSP acotada;
  admin-hub además X-Robots-Tag noindex)
- Errores: log server-side, mensaje genérico al cliente
- Sin `console.log` en producción; nunca commitear env vars

---

## Tests y CI

- CI en GitHub Actions (`.github/workflows/ci.yml`): typecheck de ambas apps +
  Vitest de store + build de producción, en cada push a main y en PRs
- Tests (Vitest, `apps/store/src/lib/__tests__/`): solo lógica crítica de
  negocio — membresías, schemas de checkout, descuento de cupón, y stock
  (reserva atómica/concurrencia) contra `mongodb-memory-server`
- Criterio: no perseguir cobertura; testear donde un bug cuesta plata o
  suspende a un cliente. `lib/stock.ts` recibe los modelos por parámetro
  justamente para poder testearse sin el contexto multi-tenant

## Deuda técnica conocida

- Registro de tenants estático (`TENANT_DOMAINS` / `PLATFORM_CLIENTS` env) —
  con 40+ clientes conviene migrarlo a una colección de plataforma
- Suspensión de membresía es manual (sin trigger automático al vencer la gracia)
- `apps/_template` es referencia histórica — no refleja la arquitectura actual, no usar
