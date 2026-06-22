# ARCHITECTURE.md — ecommerce-platform

> Technical architecture guide for LLMs. Describes HOW the system is built and
> WHY those decisions were made. Use pseudo code only — never maintain real
> implementation samples here.
>
> **Related docs:**
> - Product context → [PRD.md](./PRD.md)
> - UI/component standards → [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
> - Global rules → [../CLAUDE.md](../CLAUDE.md)

---

## Architectural Principles

1. **Server-first** — fetch data on the server, stream to the client
1. **Separation of concerns** — data, business logic, and UI are distinct layers
1. **Shared by default** — anything reusable goes to `packages/`, never copied
1. **Validate twice** — schema-level (Mongoose) and boundary-level (Zod)
1. **Tenant isolation** — no tenant app ever reads or writes another tenant's DB
1. **Fail loudly in development, gracefully in production**

---

## Multi-Tenant Architecture

The platform follows a **db-per-tenant on a shared cluster** model. Each client
gets their own MongoDB database; all databases live on one Atlas cluster.

```
┌──────────────────────────────────────────────────────────────┐
│  admin-hub  (platform operator only)                         │
│  Auth: static bearer token (ADMIN_HUB_SECRET)                │
│  DB access: MONGODB_CLUSTER_URI → useDb(tenantSlug)          │
│                                                              │
│  Reads/writes into any tenant DB by switching database       │
│  Manages: memberships, billing status, cross-tenant metrics  │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
     useDb("compumobile")       useDb("kameleba") ...
               │                          │
┌──────────────▼──────┐     ┌─────────────▼──────┐
│  MongoDB Atlas      │     │  MongoDB Atlas      │
│  DB: compumobile    │     │  DB: kameleba       │
└──────────────▲──────┘     └─────────────▲──────┘
               │                          │
┌──────────────┴──────┐     ┌─────────────┴──────┐
│  apps/compumobile   │     │  apps/kameleba      │
│  Auth: NextAuth v4  │     │  Auth: NextAuth v4  │
│  MONGODB_URI →      │     │  MONGODB_URI →      │
│  own DB only        │     │  own DB only        │
│  Vercel deployment  │     │  Vercel deployment  │
│  own domain         │     │  own domain         │
└─────────────────────┘     └────────────────────┘
```

### Two Distinct Connection Patterns

These patterns must never be mixed.

**Tenant app pattern** — single DB, cached connection:

```pseudocode
// lib/mongodb.ts in every tenant app (pseudo)
IF global.mongoose.connection exists AND state is connected:
  RETURN cached connection
ELSE:
  connection = mongoose.connect(MONGODB_URI)  // points to this tenant's DB only
  cache connection in global.mongoose
  RETURN connection
```

**admin-hub pattern** — cluster connection, switch DB per tenant:

```pseudocode
// lib/db.ts in admin-hub (pseudo)
clusterConn = mongoose.createConnection(MONGODB_CLUSTER_URI)

FUNCTION getTenantDb(tenantSlug):
  RETURN clusterConn.useDb(tenantSlug, { useCache: true })

// Usage in an API route:
db = getTenantDb("compumobile")
ProductModel = db.model("Product", ProductSchema)
products = await ProductModel.find()
```

### Tenant Registry

The list of active tenants is driven by the `PLATFORM_CLIENTS` environment
variable in admin-hub (e.g. `"compumobile,kameleba,client-3"`). This is the
source of truth for which databases admin-hub can access.

When onboarding a new client: add their slug to `PLATFORM_CLIENTS` and create
their MongoDB database. No code changes required in admin-hub.

---

## Monorepo Structure

The platform uses **Turborepo** to manage a workspace of independently
deployable apps sharing a common packages layer.

```
┌────────────────────────────────────────────────────────────┐
│                    ecommerce-platform                      │
│                                                            │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ admin-hub │  │compumob. │  │kameleba  │  │client-N │  │
│  │ (platform)│  │(tenant)  │  │(tenant)  │  │(tenant) │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  │
│        │             │             │              │        │
│  ┌─────▼─────────────▼─────────────▼──────────────▼────┐  │
│  │                    packages/                        │  │
│  │         ui  │  config  │  types  │  (future)       │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Package Dependency Rules

- Apps can import from `packages/` — always allowed
- Apps must never import from other apps — forbidden
- `packages/` must never import from `apps/` — forbidden
- Circular dependencies between packages — forbidden

---

## Application Architecture (per app)

Each storefront follows Next.js 15 App Router conventions with a clear
separation between server and client concerns.

### Request Lifecycle

```
Browser Request
    │
    ▼
Next.js Middleware          ← Session check, redirects, locale
    │
    ▼
Route Handler / Page        ← Server Component (default)
    │
    ├── Data fetching       ← Direct DB or internal API call
    │
    ├── Business logic      ← Server-side only
    │
    └── Render tree
            │
            ├── Server Components   ← Static + async data
            └── Client Components   ← Interactivity only
```

### 3-Layer State Model

The platform uses three distinct state layers. Never mix their responsibilities.

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Server State                              │
│  Owner: React Server Components + API routes        │
│  Contains: DB data, session, server-fetched content │
│  Pattern: fetch → render → stream                   │
└─────────────────────────────────────────────────────┘
            │ props / serialised data
            ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Global Client State                       │
│  Owner: Zustand stores                              │
│  Contains: cart, UI preferences, ephemeral user     │
│            state that must survive navigation       │
│  Pattern: store → subscribe → render                │
└─────────────────────────────────────────────────────┘
            │ local state
            ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Local Component State                     │
│  Owner: useState / useReducer                       │
│  Contains: form state, toggle visibility, inputs    │
│  Pattern: derive from props, never sync to global   │
└─────────────────────────────────────────────────────┘
```

**Decision rule:** start at Layer 3. Promote to Layer 2 only when state needs
to be shared across routes. Promote to Layer 1 only when state is derived from
a database.

---

## API Design

### Route Organisation

```
/app/api/
├── auth/               # NextAuth.js handlers
├── products/           # Product catalogue
│   ├── route.ts        # GET (list), POST (create)
│   └── [id]/
│       └── route.ts    # GET, PUT, DELETE (single)
├── orders/             # Order lifecycle
├── cart/               # Cart persistence
├── payments/
│   └── webhook/        # Mercado Pago webhook (HMAC-verified)
└── uploads/            # Cloudinary signed upload
```

### API Handler Pattern (pseudo code)

```pseudocode
FUNCTION handleRequest(request):
  session = await getServerSession()
  IF session is null or unauthorised:
    RETURN 401 or 403

  body = await parseBody(request)
  validated = zodSchema.safeParse(body)
  IF validated fails:
    RETURN 400 with validation errors

  result = await serviceFunction(validated.data)
  RETURN 200 with result

CATCH any error:
  log error server-side
  RETURN 500 with generic message (never expose internals)
```

### Response Shape Convention

All API responses follow a consistent envelope:

```pseudocode
// Success
{ data: <payload>, meta: { page, total } }

// Error
{ error: { code: string, message: string } }
```

Never return raw Mongoose documents — always map to plain objects and exclude
`__v`, expose `id` not `_id`.

---

## Data Layer

### MongoDB + Mongoose

The platform connects to MongoDB Atlas via a singleton connection pattern to
avoid connection exhaustion in serverless environments.

```pseudocode
// Connection singleton (pseudo)
IF global.mongoose connection exists:
  RETURN cached connection
ELSE:
  CREATE new connection
  STORE in global cache
  RETURN connection
```

### Model Conventions

```pseudocode
// Every model must define:
SCHEMA ProductSchema {
  // Required fields with types and validation
  name: string, required, trimmed
  slug: string, required, unique, auto-generated from name
  price: number, required, min: 0
  images: array of CloudinaryImage
  category: ObjectId, ref: Category
  active: boolean, default: true

  // Audit fields — always present
  createdAt: Date, auto
  updatedAt: Date, auto
}
```

### Shared Type Contracts

Database models are defined in Mongoose (`apps/*/models/`) but their TypeScript
shapes are defined in `packages/types`. This prevents apps from diverging on
type definitions.

```pseudocode
// packages/types/product.ts (pseudo)
TYPE Product = {
  id: string          // mapped from _id
  name: string
  slug: string
  price: number
  variants: ProductVariant[]
  images: CloudinaryImage[]
  category: Category
  active: boolean
  createdAt: string   // ISO 8601
  updatedAt: string
}
```

---

## Authentication

The platform uses two completely different auth models. Never mix them.

### Tenant Apps — NextAuth.js v4

### NextAuth.js v4 Session Model

```pseudocode
SESSION {
  user: {
    id: string
    email: string
    role: "customer" | "admin"
    name: string
  }
  expires: ISO date string
}
```

### Middleware Protection Pattern

```pseudocode
// middleware.ts (pseudo)
FOR each request:
  IF path matches protected routes:
    session = getToken(request)
    IF no session:
      REDIRECT to /login with callbackUrl
    IF role check required AND role mismatch:
      REDIRECT to /403
  ELSE:
    PASS through
```

### Role-Based Access (tenant apps)

| Role | Access |
|------|--------|
| `customer` | Storefront, own orders, own profile |
| `admin` | Everything + per-tenant admin routes |

Admin routes are protected at both middleware and API handler level — never
trust role from client payload alone.

### admin-hub — Static Bearer Token

admin-hub has no user accounts and no NextAuth. Access is gated by a single
static secret checked on every API route.

```pseudocode
// Every admin-hub API route (pseudo)
FUNCTION verifyOperator(request):
  authHeader = request.headers.get("Authorization")
  IF authHeader !== "Bearer " + ADMIN_HUB_SECRET:
    RETURN 401

// The dashboard page calls its own API server-side,
// so ADMIN_HUB_SECRET never reaches the browser.
```

This is intentional — admin-hub is an internal operator tool, not a
multi-user product. If multi-operator support is needed in the future,
replace this with proper auth before that point.

---

## Payments — Mercado Pago

### Flow Overview

```pseudocode
// Checkout flow (pseudo)
1. Client submits order intent
2. Server creates MP preference with order details
3. Client redirects to MP checkout
4. MP processes payment
5. MP calls /api/payments/webhook
6. Server verifies HMAC-SHA256 signature
7. Server updates order status in DB
8. Server sends confirmation email via Resend
9. Client polls order status OR receives real-time update
```

### Webhook Security

```pseudocode
FUNCTION verifyWebhook(request):
  signature = extractHeader("x-signature")
  body = await request.text()
  expected = HMAC-SHA256(MERCADOPAGO_SECRET, body)
  IF timingSafeEqual(signature, expected) is false:
    RETURN 401
  PROCESS event
```

Idempotency is required — the same webhook event may arrive multiple times.
Always check if the order status has already been updated before processing.

---

## Media — Cloudinary

All product images are hosted on Cloudinary. The storefront never handles
binary file data directly.

```pseudocode
// Upload flow (pseudo)
1. Client requests signed upload URL from /api/uploads
2. Server generates signed params (timestamp + signature)
3. Client uploads directly to Cloudinary
4. Cloudinary returns public_id and secure_url
5. Client sends public_id to API to persist on product
```

Transformations (resize, format, quality) are applied via Cloudinary URL params
at render time, not stored. Always serve `webp` format and use `auto` quality.

---

## Email — Resend

Transactional emails are sent server-side only via Resend. Never call Resend
from a Client Component.

Trigger points:
- Order confirmation → on successful payment webhook
- Password reset → on reset request
- Order status update → on admin status change

---

## compumobile-Specific: Technical Service Module

`compumobile` includes a repair/service management module that `kameleba` does
not have. This module is isolated under:

```
apps/compumobile/src/app/(service)/
apps/compumobile/src/models/ServiceOrder.ts
apps/compumobile/src/app/api/service/
```

It must never be imported by `kameleba`. Service-specific types stay in
`apps/compumobile/src/types/` and are not promoted to `packages/types`.

---

## Error Handling Strategy

### Server Side

```pseudocode
TRY:
  execute operation
CATCH known error types:
  map to appropriate HTTP status + client-safe message
CATCH unknown errors:
  log full error with context (never to client)
  return 500 with generic message
FINALLY:
  ensure DB connections are not leaked
```

### Client Side

```pseudocode
STATES to handle for every async operation:
  - idle
  - loading     → show skeleton or spinner
  - success     → show data
  - error       → show inline error with actionable message
```

Use React Error Boundaries at route segment level to prevent full-page crashes.

---

## Performance Considerations

- **Prefer Server Components** for data-heavy views — reduce client JS bundle
- **Use `next/image`** for all images — automatic optimisation and lazy loading
- **Paginate all list endpoints** — default page size: 20 items
- **Avoid prop drilling** beyond 2 levels — use Zustand or RSC composition
- **Database indexes** must exist for every field used in query filters or sorts

---

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Pure functions, utilities, Zod schemas |
| Component | React Testing Library | UI behaviour, not implementation |
| Integration | Vitest + MSW | API route handlers with mocked DB |
| E2E | Playwright | Critical user journeys only |

Test files co-locate with the source file they test. Never mock what you own —
test the real implementation.
