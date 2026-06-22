# PRD.md — ecommerce-platform

> Product requirements for LLMs and stakeholders. Defines WHAT we are building
> and WHY. Implementation details belong in ARCHITECTURE.md; UI standards in
> DESIGN_SYSTEM.md.
>
> **Related docs:**
> - Technical implementation → [ARCHITECTURE.md](./ARCHITECTURE.md)
> - UI/design standards → [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
> - Global conventions → [../CLAUDE.md](../CLAUDE.md)

---

## Product Vision

**ecommerce-platform** is a **multi-tenant SaaS platform** for Argentine retail
businesses. The operator (platform owner) deploys and manages independent
e-commerce storefronts for up to 40+ clients, each running on their own domain
with their own database, branding, and feature configuration.

The platform provides clients with a complete end-to-end commerce experience:
product discovery, checkout, payment processing (Mercado Pago), and order
management. The operator manages all clients from a central `admin-hub`,
monitoring health, membership status, and key metrics across every tenant.

The platform is designed to be long-lived and commercially operated. New clients
are onboarded by copying the `_template` app — no new infrastructure, no new
codebase.

---

## Platform Roles

| Role | Who | Access |
|------|-----|--------|
| Platform operator | You (the owner) | `admin-hub` — full cross-tenant visibility |
| Tenant admin | Client's staff | Per-tenant admin panel within their own app |
| Customer | End user | Public storefront of a specific tenant |

---

## admin-hub — Platform Operator Dashboard

**This is the operator's control panel, not a per-client admin panel.**

What it provides:
- Aggregated metrics across all tenants (orders, revenue, activity)
- Membership management — activate or suspend any tenant
- Billing status visibility per client
- Health monitoring for all active storefronts

What it does NOT do:
- Provide per-tenant product or order management (that lives inside each tenant app)
- Allow client staff to log in (operator-only tool)

---

## Membership & Billing Model

Each tenant has a `memberships` collection in their own MongoDB database.
admin-hub reads and writes this collection via `useDb(slug)` — the tenant
app itself never manages its own membership.

### Membership Document Shape

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"active"` \| `"suspended"` | Current access state |
| `paidUntil` | Date | Last day of the paid billing period (end of month) |
| `gracePeriodEnd` | Date | 15 days after `paidUntil` — suspension deadline |
| `lastPaymentDate` | Date | When the last payment was registered |
| `updatedAt` | Date | Last time admin-hub wrote to this document |

### Billing Cycle

When the operator activates a tenant via the admin-hub:

```
Activation date:  any day of the month
paidUntil:        last day of that same month
gracePeriodEnd:   15th of the following month
```

This gives clients a 15-day grace period after month end before suspension
is enforced.

### Status Transitions

```
(new tenant) ──► active ──► suspended ──► active
                              ▲               │
                              └───────────────┘
                         operator toggles at any time
```

- **activate** — sets `status: "active"`, recalculates `paidUntil` and
  `gracePeriodEnd` from today, records `lastPaymentDate`
- **suspend** — sets `status: "suspended"`, date fields unchanged

### Fallback Behaviour

If a tenant has no `memberships` document, admin-hub treats them as
`{ status: "active", paidUntil: null }`. New tenants are active by default
until explicitly suspended.

### Current Limitations

- Suspension enforcement in tenant apps is not yet implemented — status is
  stored but not checked at the storefront level
- No automatic suspension trigger on `gracePeriodEnd` — operator suspends
  manually
- No payment gateway integration — operator records payments manually via
  the activate action in admin-hub
- Tenant registry is static (`PLATFORM_CLIENTS` env var) — dynamic onboarding
  without redeployment requires a future `platform_clients` collection

---

## Tenant Applications

### compumobile

**Domain:** Technology products and services (Buenos Aires area)

**Core purpose:** Sell technology products online AND manage repair/technical
service orders within the same platform.

**What makes it unique:**
- Integrated technical service module for tracking repair jobs
- Products span hardware, peripherals, accessories, and components
- Customers can submit a repair request and track its progress online
- Operators manage both sales orders and service orders from one admin panel

**Target audience:** End consumers purchasing technology products or seeking
technical service for devices.

---

### kameleba

**Domain:** General merchandise / fashion e-commerce

**Core purpose:** Pure product-focused storefront without the service module.

**What makes it unique:**
- Fashion-oriented product model with size and colour variants
- Lookbook and outfit grouping system (planned)
- Virtual AI fitting room feature (roadmap)
- Advanced filtering by size, colour, price range, and category

**Target audience:** End consumers browsing and purchasing fashion and
lifestyle products.

---

### admin-hub (platform operator)

- Protected by static bearer token — no per-user login
- Dashboard: cross-tenant revenue, orders, membership status
- Membership management: activate or suspend any tenant
- Tenant registry driven by `PLATFORM_CLIENTS` environment variable

---

## Shared Feature Requirements

The following requirements apply to both storefronts unless explicitly noted.

### 1. Authentication & Accounts

- Customers register with email and password
- Customers can log in via email/password
- Password reset via email link (expires after 1 hour)
- Password change available from account settings
- Sessions persist across browser restarts
- Account data: name, email, shipping addresses (multiple), order history

### 2. Product Catalogue

- Products have: name, description, images (multiple), price, category,
  brand, SKU, stock quantity, and active/inactive status
- Products can belong to one category; categories can nest up to 2 levels
- Images hosted on Cloudinary; minimum 1 image required to activate a product
- Out-of-stock products remain visible but cannot be purchased
- Slug auto-generated from product name (unique, URL-safe)
- Search by name and description

### 3. Product Variants (kameleba primary, compumobile secondary)

- Variants define combinations of attributes (size, colour, material)
- Each variant has its own: SKU, price (optional override), stock, and images
- Adding a product to cart requires selecting all required variant attributes
- If only one variant exists, selection is skipped

### 4. Cart

- Cart persists for authenticated users (database-backed)
- Cart is session-based for guests (local storage)
- Guest cart merges with account cart on login
- Maximum 99 units per line item
- Cart displays: image thumbnail, name, variant, unit price, quantity
  controls, line total, and remove action
- Cart total displays before and after any applied discounts

### 5. Checkout

- Shipping address: select from saved addresses or enter a new one
- New addresses can be saved to the account during checkout
- Payment via Mercado Pago (redirect flow)
- Order is created server-side before payment redirect
- Order status updates via Mercado Pago webhook (not client redirect)
- Confirmation email sent on successful payment

### 6. Orders

**Statuses:**

| Status | Meaning |
|--------|---------|
| `pending_payment` | Created, awaiting payment confirmation |
| `confirmed` | Payment received |
| `processing` | Being prepared for dispatch |
| `shipped` | Dispatched, tracking available |
| `delivered` | Confirmed delivered |
| `cancelled` | Cancelled (by customer or operator) |
| `refunded` | Payment returned |

- Customers can view all their orders with current status
- Customers can cancel an order in `pending_payment` or `confirmed` status
- Operators can update order status and add tracking information
- Status changes trigger email notifications to the customer

### 7. Search & Discovery

- Full-text search on product name and description
- Filter by: category, price range, brand, availability
- Sort by: relevance, price ascending/descending, newest
- Paginated results (default 20 products per page)
- URL state reflects active filters and sort (shareable links)

### 8. Admin Panel (admin-hub)

- Protected behind `admin` role — inaccessible to customers
- Dashboard: today's orders, revenue, low-stock alerts, recent activity
- Products: CRUD with image upload, bulk archive/activate
- Orders: list with filters by status/date, detail view, status update
- Customers: list, profile view, order history

---

## compumobile-Specific Requirements

### Technical Service Module

Customers can submit a repair request for a device. The request captures:

- Device type (category), brand, model
- Problem description (free text)
- Contact details (pre-filled if logged in)
- Optional: photos of the device/issue

**Service order statuses:**

| Status | Meaning |
|--------|---------|
| `received` | Request submitted |
| `diagnosing` | Technician evaluating |
| `quote_sent` | Budget sent to customer |
| `approved` | Customer approved the quote |
| `in_repair` | Repair in progress |
| `ready` | Repair complete, awaiting pickup |
| `delivered` | Device returned to customer |
| `rejected` | Customer rejected quote or cancelled |

- Customers can track service order status with a reference number
  (no login required)
- Operators update status and add technician notes from admin-hub
- Status change notifications sent via email

---

## kameleba-Specific Requirements

### Variant System

Full attribute-based variant model:

- Define variant attributes per product (e.g. Size: S, M, L, XL; Colour: Red,
  Blue)
- Each combination generates a variant with independent stock and optional
  price override
- Display available attributes as swatches (colour) or buttons (size)
- Unavailable variant combinations are visually indicated, not hidden

### Outfit / Lookbook System (Planned)

- Group multiple products into a named "look" or outfit
- Each look has a cover image and optional editorial description
- Products in a look can be added to cart individually or as a group
- Admin creates and manages looks from admin-hub

### Virtual AI Fitting Room (Roadmap)

- Customer uploads a photo and selects a garment product
- AI generates a preview of the customer wearing the garment
- Preview is watermarked and non-downloadable
- Requires explicit customer consent before photo upload

---

## Business Rules

- Prices are in **Argentine Pesos (ARS)**
- Stock is decremented when an order reaches `confirmed` status
- Stock is restored when an order reaches `cancelled` or `refunded` status
- A product cannot be deleted if it has associated orders — only archived
- Email must be unique per customer account
- Admins cannot delete orders — only cancel or refund them
- Mercado Pago is the exclusive payment method (no cash on delivery, no other
  gateways — subject to future review)

---

## Non-Goals (Current Scope)

The following are explicitly out of scope for the current version:

- Multi-currency support
- Physical store (POS) integration
- Supplier / B2B purchasing flows
- Subscription or recurring payments
- Product reviews and ratings (planned but not scheduled)
- Multi-language support (Spanish only)
- Native mobile apps (responsive web only)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Checkout conversion rate | > 3% of sessions |
| Cart abandonment rate | < 70% |
| Average page load (LCP) | < 2.5s on 4G mobile |
| Admin order processing time | < 2 min per order |
| Uptime | 99.9% monthly |
