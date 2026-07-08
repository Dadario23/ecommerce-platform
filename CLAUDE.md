# CLAUDE.md — ecommerce-platform

Instrucciones para Claude Code. Leé este archivo completo antes de tocar cualquier código.

---

## Qué es este proyecto

Plataforma SaaS multi-tenant para e-commerce. Un solo deployment en Vercel sirve a todos los clientes. Cada cliente tiene su propia base de datos MongoDB en un cluster compartido. El tenant activo se detecta por dominio en producción, o por la variable `TENANT_SLUG` en desarrollo local.

Los clientes actuales son `bitm-cel` (e-commerce + soporte técnico, antes llamado "compumobile"), `kameleba` (moda) y `compumobile` (e-commerce + soporte técnico, dominio www.compumobile.com.ar — cliente nuevo, sin relación con el slug viejo). El objetivo es llegar a 40+ clientes sin crear nuevos deployments.

---

## Estructura del monorepo

```
ecommerce-platform/
├── apps/
│   ├── store/        ← LA APP PRINCIPAL — único deployment para todos los clientes
│   ├── admin-hub/    ← Panel del superadmin (solo el operador de la plataforma)
│   └── _template/    ← no usar, referencia histórica
├── packages/
│   └── tenant/       ← resolveTenant() + connectTenantDB() — núcleo del multi-tenant
├── ARCHITECTURE.md   ← cómo está construido el sistema y por qué
├── PRD.md            ← qué hace el producto (features, reglas de negocio)
├── DESIGN_SYSTEM.md  ← tokens, theming por tenant, patrones de UI
├── CLAUDE.md
├── turbo.json
└── package.json
```

---

## Stack tecnológico

| Capa           | Tecnología                                             |
| -------------- | ------------------------------------------------------ |
| Framework      | Next.js 15 (App Router)                                |
| Lenguaje       | TypeScript strict                                      |
| Base de datos  | MongoDB Atlas — un DB por tenant en cluster compartido |
| Auth           | NextAuth.js v4 con JWT strategy                        |
| Pagos          | Mercado Pago                                           |
| Imágenes       | Cloudinary                                             |
| Email          | Resend                                                 |
| Estilos        | Tailwind CSS v4 + shadcn/ui                            |
| Estado cliente | Zustand                                                |
| Formularios    | React Hook Form + Zod                                  |
| Monorepo       | Turborepo                                              |
| Deployment     | Vercel — un solo proyecto para todos los tenants       |

---

## Cómo funciona el multi-tenant

```
bitm-cel.com.ar        ──┐
kameleba.com.ar        ──┤──▶  apps/store  ──▶  middleware  ──▶  resolveTenant(host)
www.compumobile.com.ar ──┘                                              │
                                                                        ▼
                                                          connectTenantDB(slug)
                                                          useDb('bitm-cel') o
                                                          useDb('kameleba') o
                                                          useDb('compumobile')
```

**El slug del tenant determina la base de datos.** El nombre del slug debe coincidir exactamente con el nombre de la base de datos en Atlas.

### Cómo se accede a los datos en store

Siempre usar `getModels()` de `@/lib/tenant-models`. Nunca importar modelos directamente ni usar `connectDB()`.

```typescript
// CORRECTO
const { Product, Order, User } = await getModels();
const products = await Product.find({ isActive: true });

// INCORRECTO — rompe el multi-tenant
import Product from "@/models/Product";
await connectDB();
```

### Módulos por tenant

Cada tenant puede tener módulos habilitados o deshabilitados. La configuración se lee de `Setting` en la DB de cada cliente con `getClientConfig()`:

| Módulo                      | bitm-cel | kameleba | compumobile |
| --------------------------- | -------- | -------- | ----------- |
| `repairs` (soporte técnico) | true     | false    | true        |
| `budgets`                   | false    | false    | true        |
| `shipping`                  | true     | true     | true        |
| `coupons`                   | true     | true     | true        |

### Membresías

La colección `memberships` de cada tenant la **escribe solo admin-hub** (activar,
suspender, registrar pagos). El store solo la lee: `getEffectiveMembershipStatus()`
en `lib/membership.ts` calcula el estado efectivo (sin doc = activo; vencido corre
la gracia hasta `gracePeriodEnd` o el día 15; después, suspendido) y el layout
muestra "tienda fuera de servicio" solo con estado `suspended`. Ante error de
lectura la tienda sigue operando — nunca cortar un tenant por una falla nuestra.

---

## Variables de entorno — apps/store

| Variable                                                                 | Propósito                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `TENANT_SLUG`                                                            | Solo en dev local — fuerza un tenant sin necesitar el dominio |
| `MONGODB_CLUSTER_URI`                                                    | URI del cluster sin nombre de DB                              |
| `NEXTAUTH_SECRET`                                                        | Secreto para JWT                                              |
| `NEXTAUTH_URL`                                                           | URL canónica de la app                                        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                              | OAuth Google                                                  |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Imágenes                                                      |
| `RESEND_API_KEY`                                                         | Emails transaccionales                                        |
| `FROM_EMAIL`                                                             | Remitente de emails (fallback)                                |
| `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY`                                      | Pagos Mercado Pago (fallback)                                 |
| `MP_WEBHOOK_SECRET`                                                      | Verificación de webhooks MP (fallback)                        |
| `MP_ALIAS` / `MP_CVU`                                                    | Datos de transferencia (fallback)                             |
| `NEXT_PUBLIC_URL`                                                        | URL pública de la app (fallback)                              |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                                            | WhatsApp de contacto (fallback)                               |

> En producción `TENANT_SLUG` no se usa — el tenant se resuelve por `TENANT_DOMAINS` (ej: `bitm-cel.com.ar:bitm-cel,kameleba.com.ar:kameleba,www.compumobile.com.ar:compumobile`). La comparación de hostname es exacta: si un cliente entra con y sin `www`, ambos hostnames necesitan su entrada.

> **Credenciales por tenant:** las credenciales de MP, el remitente de emails, los datos de transferencia y el WhatsApp se leen del documento `Setting` de cada tenant (`mpAccessToken`, `mpWebhookSecret`, `fromEmail`, `transferAlias`, `transferCvu`, `whatsappNumber`) vía `getTenantSecrets()` / `getClientConfig()`. Las env vars marcadas "(fallback)" solo se usan si el campo del Setting está vacío. La URL pública se deriva del host de la request (`getBaseUrl()`).

---

## Variables de entorno — admin-hub

| Variable              | Propósito                                        |
| --------------------- | ------------------------------------------------ |
| `MONGODB_CLUSTER_URI` | URI del cluster — accede a todas las DBs         |
| `ADMIN_HUB_SECRET`    | Bearer token para autenticar todas las rutas API |
| `PLATFORM_CLIENTS`    | Lista de slugs separados por coma                |

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Correr la tienda como un tenant específico
# (TENANT_SLUG=bitm-cel | kameleba | compumobile en apps/store/.env.local)
npm run dev:store

# Correr el admin-hub
npm run dev:admin
```

**Importante:** cada vez que cambies `TENANT_SLUG` en `.env.local`, reiniciá el servidor. El middleware compila el env al inicio y no lo recarga en caliente.

---

## Agregar un nuevo cliente

1. Crear la base de datos `<slug>` en el cluster Atlas
2. Agregar `<slug>` a `TENANT_DOMAINS` en las env vars de Vercel (`dominio.com:<slug>`)
3. Agregar `<slug>` a `PLATFORM_CLIENTS` en admin-hub
4. Apuntar el dominio del cliente a Vercel
5. Configurar los módulos del tenant en su documento `Setting` en la DB
6. Cargar en el mismo `Setting` las credenciales del tenant con
   `node apps/admin-hub/scripts/seed-tenant-secrets.mjs <slug>` (interactivo:
   `mpAccessToken`, `mpWebhookSecret`, `fromEmail`, `transferAlias`,
   `transferCvu`, `whatsappNumber`; Enter conserva, `-` vacía → fallback env)

No se crea una app nueva. No se hace un deployment nuevo.

---

## Reglas de código

### Nombrado

- Archivos y carpetas: inglés, lo más descriptivo posible
- Componentes: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase con prefijo `use` (`useCart.ts`)
- Utilidades: camelCase (`formatPrice.ts`)
- Rutas API: kebab-case (`/api/product-variants/`)
- Modelos Mongoose: PascalCase singular (`Product`, `Order`)
- Constantes: SCREAMING_SNAKE_CASE

### Tamaño de archivos

- Los componentes no deben superar 400 líneas
- Si un archivo tiene más de 450 líneas, sugerir refactorizar antes de continuar

### TypeScript

- Strict mode siempre activo
- Nunca usar `any` ni `// @ts-ignore`
- Preferir `type` sobre `interface`

### Base de datos

- Todo acceso a DB pasa por `getModels()` en store, o por `useDb(slug)` en admin-hub
- Nunca queries crudas — siempre Mongoose
- Nunca exponer `_id` al cliente — mapear a `id` string
- Validar en el schema (Mongoose) Y en el boundary (Zod)

### Seguridad

- Rutas `/api` en store: validar sesión NextAuth antes de procesar
- Rutas `/api` en admin-hub: validar bearer token `ADMIN_HUB_SECRET`
- Webhooks: verificar firma HMAC-SHA256
- Nunca commitear variables de entorno

### General

- Sin `console.log` en código de producción
- Sin comentarios obvios — solo comentar el "por qué" si no es evidente
- Sin abstracciones que nadie pidió

---

## Lo que Claude no debe hacer

- Usar `connectDB()` o importar modelos directamente en `apps/store` — siempre `getModels()`
- Hardcodear slugs de tenants en código compartido
- Usar el patrón de `admin-hub` (`MONGODB_CLUSTER_URI` + `useDb`) dentro de `apps/store`
- Agregar dependencias sin verificar si ya existe algo equivalente
- Modificar `apps/_template` sin instrucción explícita
