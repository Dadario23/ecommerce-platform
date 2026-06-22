# DESIGN_SYSTEM.md — ecommerce-platform

> Design system documentation for LLMs. Defines tokens, component patterns,
> accessibility standards, and UI conventions. All UI work must reference this
> document before writing any styles or components.
>
> **Related docs:**
> - Component architecture → [ARCHITECTURE.md](./ARCHITECTURE.md)
> - Brand requirements → [PRD.md](./PRD.md)
> - Global rules → [../CLAUDE.md](../CLAUDE.md)

---

## Core Principle: Token-First

**Never hardcode a colour, font size, spacing value, or shadow.**
Every visual decision must trace back to a design token. This makes theming,
app-to-app consistency, and future rebrandin trivial.

```
Wrong:  className="text-[#1a1a1a] text-[14px] p-[16px]"
Right:  className="text-foreground text-sm p-4"
```

---

## Technology Stack

- **Tailwind CSS v4** — utility-first with CSS custom property tokens
- **shadcn/ui** — headless component primitives, locally owned
- **CSS custom properties** — the source of truth for all tokens

Tailwind v4 reads tokens from CSS custom properties defined in the global
stylesheet. Do not define token values in `tailwind.config` — define them in
CSS and let Tailwind consume them.

---

## Design Tokens

### Colour System

Tokens use semantic naming — always refer to the token's **purpose**, not its
colour value.

#### Semantic Colour Tokens

| Token | Purpose | Do not use for |
|-------|---------|----------------|
| `--background` | Page background | Component backgrounds |
| `--foreground` | Primary text on background | Muted or secondary text |
| `--card` | Card/surface background | Page background |
| `--card-foreground` | Text on card surfaces | — |
| `--popover` | Popover/dropdown background | — |
| `--popover-foreground` | Text on popovers | — |
| `--primary` | Brand actions, CTAs, links | Decorative elements |
| `--primary-foreground` | Text on primary background | — |
| `--secondary` | Secondary actions, badges | Primary actions |
| `--secondary-foreground` | Text on secondary background | — |
| `--muted` | Disabled states, subtle backgrounds | Active elements |
| `--muted-foreground` | Placeholder text, captions | Body text |
| `--accent` | Hover states, highlights | Brand identity |
| `--accent-foreground` | Text on accent background | — |
| `--destructive` | Delete, error, danger | Warning states |
| `--destructive-foreground` | Text on destructive background | — |
| `--border` | Borders, dividers | Backgrounds |
| `--input` | Form input borders | — |
| `--ring` | Focus rings | — |

#### App-Level Colour Overrides

Each app can define its own brand tokens as CSS custom properties without
forking shared components:

```pseudocode
// apps/compumobile/src/styles/brand.css (pseudo)
:root {
  --primary: <compumobile brand primary>;
  --primary-foreground: <contrast text>;
}

// apps/kameleba/src/styles/brand.css (pseudo)
:root {
  --primary: <kameleba brand primary>;
  --primary-foreground: <contrast text>;
}
```

The shared `packages/ui` components remain unchanged — only the token values
differ per app.

---

### Typography Scale

| Token class | Use case |
|------------|---------|
| `text-xs` | Captions, labels, legal |
| `text-sm` | Secondary text, metadata, form hints |
| `text-base` | Body text (default) |
| `text-lg` | Lead paragraphs, card titles |
| `text-xl` | Section headings (minor) |
| `text-2xl` | Section headings (major) |
| `text-3xl` | Page headings |
| `text-4xl` + | Hero headings only |

**Font weight conventions:**

| Weight | Use |
|--------|-----|
| `font-normal` | Body text |
| `font-medium` | UI labels, button text |
| `font-semibold` | Card titles, section headers |
| `font-bold` | Page titles, primary headings |

Font families are defined as CSS custom properties (`--font-sans`,
`--font-mono`) and loaded via `next/font`. Never import Google Fonts directly
in components.

---

### Spacing

Follow Tailwind's default spacing scale. Do not use arbitrary values unless
approved.

| Pattern | Usage |
|---------|-------|
| `gap-2 / gap-4` | Tight component internal spacing |
| `gap-6 / gap-8` | Component-level spacing |
| `gap-12 / gap-16` | Section-level spacing |
| `p-4 / p-6` | Card internal padding |
| `px-4 / py-2` | Button padding |
| `container mx-auto` | Page-level content centering |

---

### Border Radius

```pseudocode
--radius: base radius value (defined per app)

Derived tokens:
  --radius-sm: calc(var(--radius) - 4px)
  --radius-md: calc(var(--radius) - 2px)
  --radius-lg: var(--radius)
  --radius-xl: calc(var(--radius) + 4px)
```

Use `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` — never hardcode
pixel values.

---

## Component Standards

### shadcn/ui Components

shadcn/ui components live in `packages/ui/components/ui/`. They are locally
owned — modify them when needed, but keep changes backwards-compatible.

**Never install shadcn/ui components directly into an app** — always add to
`packages/ui` first so all apps benefit.

#### Accepted shadcn/ui Components

| Component | Usage context |
|-----------|--------------|
| `Button` | All interactive actions |
| `Input` | All text inputs |
| `Select` | Dropdown selection |
| `Dialog` | Modal overlays |
| `Sheet` | Mobile drawers, side panels |
| `Card` | Content containers |
| `Badge` | Status indicators, labels |
| `Skeleton` | Loading states |
| `Toast / Sonner` | Feedback notifications |
| `Table` | Admin data tables |
| `Form` | React Hook Form wrapper |

#### Extending Components

Extend via the `className` prop and `cn()` utility — never wrap a shadcn
component in another component just to change its styles.

```pseudocode
// Correct (pseudo)
<Button className={cn("w-full", isLoading && "opacity-50")}>

// Wrong (pseudo)
<FullWidthButton>   ← unnecessary wrapper
```

---

### Product Card Pattern

The product card is the most repeated UI pattern. It must follow this structure:

```pseudocode
ProductCard {
  // Image area
  - Aspect ratio: 1:1 (square)
  - next/image with fill layout
  - Skeleton shown during load
  - Hover: subtle scale or overlay

  // Content area
  - Product name: text-sm font-medium, 2 lines max (line-clamp-2)
  - Price: text-base font-semibold text-primary
  - Secondary info (brand, condition): text-xs text-muted-foreground
  - CTA button: full width on mobile, auto on desktop

  // States
  - Out of stock: muted overlay + "Sin stock" badge
  - On sale: original price struck through + sale badge
  - Loading: Skeleton for all areas
}
```

---

### Form Pattern

All forms use React Hook Form + Zod. UI is built with shadcn/ui `Form`
primitives.

```pseudocode
FORM STRUCTURE:
  FormField wraps every input
    └── FormItem
          ├── FormLabel       (required indicator if field is required)
          ├── FormControl
          │     └── Input / Select / Textarea
          ├── FormDescription (optional hint text)
          └── FormMessage     (validation error — shown on blur + submit)

SUBMIT BUTTON:
  - Shows loading spinner while pending
  - Disabled during submission
  - Text changes: "Guardar" → "Guardando..." → back to "Guardar"
```

---

### Empty States

Every list view must have an empty state. Empty states are not error messages
— they are invitations to act.

```pseudocode
EMPTY STATE STRUCTURE:
  - Icon relevant to the content type (not a generic "no data" icon)
  - Heading: what is empty (e.g. "No hay productos")
  - Body: what to do next (e.g. "Agregá tu primer producto para comenzar")
  - CTA button if an action is available
```

---

### Loading States

```pseudocode
LOADING HIERARCHY:
  1. Page-level: Next.js loading.tsx with full page skeleton
  2. Section-level: Skeleton components matching content shape
  3. Button-level: Spinner inside button, button stays sized
  4. Inline: text-muted-foreground "Cargando..." label

NEVER:
  - Show a blank white screen during load
  - Use a spinner that blocks the entire viewport
  - Flash content before data is ready (prefer SSR / RSC)
```

---

### Error States

```pseudocode
ERROR DISPLAY RULES:
  - Inline under the field that caused it (form errors)
  - Inline banner at top of section (API errors on forms)
  - Toast for non-blocking background operation failures
  - Error boundary page for route-level failures

ERROR MESSAGE RULES:
  - Plain language: "El email ya está en uso" not "UNIQUE_CONSTRAINT_VIOLATION"
  - Always actionable: tell the user what to do next
  - Never expose stack traces, IDs, or internal codes to end users
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Prefix | Min width | Target |
|--------|----------|--------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Large mobile / landscape |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

### Mobile-First Rules

- Write base styles for mobile, override at larger breakpoints
- Navigation collapses to Sheet (drawer) on mobile
- Product grids: 2 columns mobile → 3 tablet → 4 desktop
- Admin tables: horizontally scrollable on mobile
- Touch targets: minimum 44×44px for all interactive elements

---

## Accessibility Standards

Minimum target: **WCAG 2.1 AA** for all user-facing interfaces.

### Colour Contrast

| Text type | Minimum ratio |
|-----------|-------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px or 14px bold) | 3:1 |
| UI components and graphics | 3:1 |

Always verify contrast when overriding brand colour tokens.

### Keyboard Navigation

- All interactive elements reachable via Tab
- Focus ring always visible — never `outline: none` without a replacement
- Modals trap focus while open
- Escape closes all overlays
- Custom interactive components implement ARIA roles and keyboard handlers

### Screen Reader Support

```pseudocode
REQUIRED for all interactive elements:
  - Meaningful accessible name (label, aria-label, or aria-labelledby)
  - State communicated via aria-* (aria-expanded, aria-selected, aria-disabled)
  - Loading state: aria-busy="true" on the loading container
  - Errors: aria-describedby linking input to its error message
  - Images: descriptive alt text; decorative images use alt=""
```

### Reduced Motion

Respect `prefers-reduced-motion`. All animations must have a static fallback:

```pseudocode
// CSS pattern (pseudo)
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 200ms ease;
  }
}
```

---

## Icon Usage

Use a single icon library consistently — do not mix libraries. Icons must:

- Always have an accessible label (`aria-label` or visually hidden text)
  when used without adjacent text
- Be sized relative to surrounding text (1em width/height)
- Use `stroke` not `fill` for line icons to ensure consistent weight

---

## Internationalisation (i18n)

All user-facing copy is in **Spanish (Argentina)**. Follow these conventions:

- Currency: Argentine Peso — format as `$ 1.234,50` (period thousands, comma
  decimal)
- Dates: `DD/MM/YYYY` format
- Voseo forms: use _vos_ conjugation ("Ingresá tu email", not "Ingresa...")
- Avoid anglicisms when a natural Spanish term exists

---

## Do Not

- Hardcode any colour value (hex, rgb, hsl) in a component
- Use arbitrary Tailwind values (`w-[347px]`) without a documented reason
- Add new shadcn/ui components to an individual app — always go through
  `packages/ui`
- Disable focus styles
- Use `cursor-pointer` on non-interactive elements
- Ship animations without a `prefers-reduced-motion` fallback
- Mix icon libraries in the same app
