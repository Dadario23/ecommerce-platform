# Kameleba — Style Reference
> streetwear editorial en papel crudo — fondo crema cálido, wordmark condensado en foto de tapa, y un único acento ocre que solo aparece donde hay que actuar

**Theme:** light
**Fuente de verdad:** `apps/store/src/config/tenant-themes.ts` (entrada `"kameleba"`) — este documento la explica, no la reemplaza. Ante cualquier discrepancia, el código manda.

Kameleba lee como un catálogo de calle: fondo crema cálido (no blanco puro) con textura de fondo, negro casi puro para tipografía/estructura, y un único acento ocre/mostaza reservado a momentos puntuales. Tarjetas de producto sin borde ni sombra (`cardStyle: minimal`) — el producto flota sobre el fondo, sin contenedor. Tipografía dual: sans (Geist) para toda la interfaz, condensada display (Anton) reservada al wordmark cuando no hay logo cargado. Esquinas casi rectas (`radius: 0.125rem`) en vez de las curvas suaves del resto de la plataforma.

## Tokens — Colores

| Nombre | Valor | Variable | Rol |
|---|---|---|---|
| Primary | `#0A0A0A` | `--tenant-primary` | Texto, wordmark, "Agregar al carrito", bordes, avatar de usuario, hover de categorías/buscador |
| Primary Hover | `#262626` | `--tenant-primary-hover` | Estado hover/pressed de botones en `primary` |
| On Primary | `#FFFFFF` | `--tenant-on-primary` | Texto sobre superficies en `primary` (ej. franja de beneficios en variante `solid`) |
| Tint | `#F5F5F5` | `--tenant-tint` | Superficie secundaria clara — franja de beneficios (variante `light`), hover de items de búsqueda |
| Accent | `#B45309` | `--tenant-accent` | **Reservado exclusivamente al botón "Comprar ahora"** (único CTA que lo usa) — ver "Disciplina de acento único" abajo. Cumple AA (5.02:1) contra blanco |
| Background | `#FAF6EE` | `--tenant-background` (vía `body { background }`) | Canvas de página — el crema cálido que da el tono "papel" |

Reemplaza el acento anterior (`#DB2777`, magenta) — cambio 2026-07-27 por preferencia de marca, verificado con el mismo criterio de contraste AA.

**2026-07-27 — disciplina de acento único** (inspirado en el style-reference de Anthropic que compartió el usuario): el ocre se sacó de todo uso decorativo y quedó reservado al único CTA más consecuente. Antes se usaba también en avatar de usuario, badge de descuento, hover de categorías y focus ring del buscador — todos esos pasaron a `primary` (o, en el caso del badge de descuento, al rojo semántico por defecto, desacoplado de la marca). Ver "Notas de diseño" más abajo, ya no aplica la observación anterior (el acento ahora sí marca la acción).

## Tokens — Tipografía

Configuración real en `apps/store/src/app/layout.tsx` (`FONT_VARS.urban`):

| Rol | Fuente | Variable | Uso |
|---|---|---|---|
| Sans (UI) | Geist | `--tenant-font-sans` → `--font-sans` | Toda la interfaz: nav, botones, precios, cuerpo de texto |
| Display | Anton | `--tenant-font-display` → `--font-brand` | Wordmark en `<h1 className="font-brand">` — **solo se ve si `theme.logo` es `null`**; kameleba tiene logo (`/logo-kameleba.png`), así que hoy Anton no se renderiza en producción, queda como fallback |

No hay una escala tipográfica propia por tenant — los tamaños (`text-xs`, `text-sm`, etc.) son los de Tailwind compartidos por toda la plataforma, no se documentan acá para no duplicar `DESIGN_SYSTEM.md`.

## Tokens — Forma

- **Radius base:** `0.125rem` (~2px) — mucho más recto que el default de la plataforma (`0.65rem`). Refleja la estética "editorial/streetwear", no curva.
- **`cardStyle: "minimal"`** (`data-card-style="minimal"` en `<html>`, variante Tailwind `minimal:`): las tarjetas de producto pierden borde, fondo y sombra por completo (`minimal:rounded-none minimal:border-0 minimal:bg-transparent`), la imagen pasa a recorte `aspect-3/4` (retrato, no cuadrado) y al hover revela una segunda foto.
- **`navStyle: "light"`**: navbar clara/transparente en vez de sólida en `primary`.
- **Radio "solo abajo" en el CTA principal** (2026-07-27, inspirado en el DESIGN.md compartido): "Comprar ahora" usa `rounded-xl minimal:rounded-t-none` — esquinas rectas arriba, curvas abajo. Reutiliza la variante `minimal:` existente (no se creó un campo nuevo en `TenantTheme`), así que solo aplica donde `cardStyle: "minimal"` (hoy, solo kameleba).
- **Subrayado persistente en links de marca** (2026-07-27, misma inspiración): los links en `text-(--tenant-primary)` de login/registro/reseñas/categoría (ej. "¿Olvidaste tu contraseña?", "Registrate aquí") llevan `minimal:underline` — subrayado siempre visible en vez de solo al hover. No se aplicó en `ProductDetailsSection.tsx` porque es un componente del panel admin, no de la tienda.

## Componentes (valores reales, no genéricos)

### Product Card (variante minimal)
`src/components/home/HomeProductCard.tsx` / `CategoryProductCard.tsx` — sin fondo ni borde, imagen `aspect-3/4` con crossfade a una segunda foto en hover, badge de descuento en rojo semántico (`bg-red-500`, sin acento de marca) sin redondeo, categoría en `text-gray-500` (no en `primary`).

### Botones de compra
`src/components/products/ProductBuyActions.tsx` — "Agregar al carrito": outline en `primary`, se rellena de `primary` al hover. "Comprar ahora": relleno sólido en `accent`, esquinas rectas arriba/curvas abajo (`minimal:rounded-t-none`) — el único botón de todo el sitio que usa el acento ocre.

### Hero editorial
`src/components/home/variants/EditorialHero.tsx` — carousel full-bleed con overlay `bg-black/30`, logo centrado sobre la foto, subtítulo "Nueva colección" en mayúsculas con tracking amplio, CTA rectangular blanco sin redondeo (`bg-white text-gray-900`, sin `rounded-*`).

### Franja de beneficios
`src/components/BenefitsBar.tsx` — variante `light` (la que usa el home editorial): fondo `tint`, texto en `primary`.

## Notas de diseño (observaciones, no reglas del código)

- ~~El acento ocre no cumplía el rol de "marcar la acción"~~ — resuelto 2026-07-27, ver "Disciplina de acento único" arriba.
- El hover de categorías en el navbar (`Navbar.tsx`, rama `light`) pasó de `hover:text-accent` a `hover:text-primary`, pero el color base ya es `text-gray-900` (muy cercano a `primary` `#0A0A0A`) — el cambio de color al hover es ahora sutil, casi imperceptible. Es el mismo comportamiento que tiene el propio nav de Anthropic en su referencia (no usan su acento clay para hover de nav tampoco), así que es consistente con la inspiración, pero si se quiere un hover más notorio habría que cambiar el color base del link (no solo el de hover) — no se tocó, es una observación abierta.

## Imagery

Fotografía de calle/urbana (graffiti, retratos con estética tatuaje) para el hero — sin ilustración, sin producto en fondo blanco de catálogo. Patrón de fondo translúcido repetido (`backgroundPattern: /pattern-kameleba.png`) sobre el crema base, vía `--background-pattern` en `globals.css`.

## Quick reference

```
primary:        #0A0A0A
primary-hover:  #262626
on-primary:     #FFFFFF
tint:           #F5F5F5
accent:         #B45309
background:     #FAF6EE
font sans:      Geist
font display:   Anton (fallback, no visible con logo activo)
radius:         0.125rem
cardStyle:      minimal
navStyle:       light
homeVariant:    editorial
```
