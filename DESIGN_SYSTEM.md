# DESIGN_SYSTEM.md — ecommerce-platform

> Tokens, theming por tenant y patrones de UI. Leer antes de escribir estilos
> o componentes.
>
> **Docs relacionadas:**
> - Arquitectura → [ARCHITECTURE.md](./ARCHITECTURE.md)
> - Producto → [PRD.md](./PRD.md)
> - Reglas de trabajo → [CLAUDE.md](./CLAUDE.md)

---

## Stack

- **Tailwind CSS v4** — tokens como CSS custom properties en
  `apps/store/src/app/globals.css` (`:root` en HSL + bloque `@theme inline`
  que los expone a Tailwind). No hay `tailwind.config` de tokens.
- **shadcn/ui** — componentes de propiedad local en
  `apps/store/src/components/ui/` (button, dialog, sheet, card, badge,
  skeleton, table, form, sonner, …). No existe `packages/ui`: admin-hub es una
  herramienta interna con su propia UI mínima.
- Extender con `className` + `cn()` — no envolver un componente shadcn solo
  para cambiarle estilos.

---

## Regla central: token-first

Nunca hardcodear color, tamaño ni sombra en un componente.

```
Mal:   className="text-[#1a1a1a] p-[16px]"
Bien:  className="text-foreground p-4"
```

Tokens semánticos disponibles (los de shadcn): `background/foreground`,
`card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`,
`border`, `input`, `ring` — siempre por **propósito**, no por color.

---

## Theming por tenant

El branding de cada tenant es **estático y vive en el código**, en
`apps/store/src/config/tenant-themes.ts` — una entrada `TenantTheme` por slug.
No hay editor de temas en runtime: dar de alta o retocar un tema es un cambio
de código hecho por el dev (decisión deliberada: menos superficie de error
que un theme builder).

```pseudocode
TenantTheme {
  storeName
  colors: { primary, primaryHover, onPrimary, tint, accent, background? }
  backgroundPattern?   // PNG translúcido repetido sobre el fondo
  radius
  font: "geist" | "manrope" | "editorial" | "urban"   // cargadas via next/font
  logo: { src, invert? } | null    // null → wordmark con storeName
  favicon | null
  navStyle: "solid" | "light"      // barra en primary vs. blanca
  cardStyle: "boxed" | "minimal"   // card con borde vs. limpia (variante CSS `minimal:`)
  homeVariant: "tech" | "editorial"
  benefits[] / promoItems[]        // íconos + copy de la franja de beneficios
}
```

Reglas:

- Un tema nuevo = una entrada nueva en `tenant-themes.ts`; nunca condicionar
  por slug dentro de un componente
- Los colores del tema deben cumplir contraste AA contra `onPrimary`/fondo
- Las fuentes se cargan con `next/font` en el layout (`FONT_VARS`) — nunca
  importar Google Fonts en un componente

---

## Patrones

### Formularios
React Hook Form + Zod con los primitivos `Form` de shadcn: `FormField →
FormItem → FormLabel + FormControl + FormMessage`. El submit muestra estado
pendiente ("Guardar" → "Guardando…") y queda deshabilitado durante el envío.
El schema Zod del form es el mismo contrato que valida la API en el boundary.

### Estados de listas y operaciones async
Toda vista async maneja: loading (skeleton con la forma del contenido, no
spinner de pantalla completa), éxito, error (mensaje accionable, nunca un
código interno) y **vacío** (ícono del dominio + qué hacer a continuación +
CTA si aplica).

### Tarjeta de producto
Imagen 1:1 con `next/image`, nombre `line-clamp-2`, precio destacado, precio
de comparación tachado si hay oferta, badge "Sin stock" con overlay muted. La
variante visual la decide `cardStyle` del tema del tenant, no el componente.

---

## Responsive

Mobile-first con los breakpoints default de Tailwind. Navegación colapsa a
Sheet en mobile; grillas de producto 2 → 3 → 4 columnas; tablas admin con
scroll horizontal; targets táctiles ≥ 44×44px.

---

## Accesibilidad (WCAG 2.1 AA)

- Contraste: 4.5:1 texto normal, 3:1 texto grande y componentes UI —
  verificarlo al definir colores de un tema nuevo
- Todo interactivo alcanzable por teclado; focus ring visible siempre
  (nunca `outline: none` sin reemplazo); modales atrapan el foco; Escape cierra
- Nombre accesible en todo control (label, `aria-label`); errores linkeados
  con `aria-describedby`; imágenes decorativas con `alt=""`
- Animaciones con fallback `prefers-reduced-motion`

---

## Idioma y formato (es-AR)

- Voseo: "Ingresá tu email", "Volvé a intentarlo"
- Moneda: `$ 1.234,50` (`toLocaleString("es-AR")`)
- Fechas: `DD/MM/YYYY`
- Evitar anglicismos cuando hay término natural en español

---

## No hacer

- Hardcodear colores o usar valores arbitrarios (`w-[347px]`) sin razón documentada
- Condicionar UI por slug de tenant — todo pasa por el tema o los módulos
- Deshabilitar estilos de foco
- `cursor-pointer` en elementos no interactivos
- Mezclar librerías de íconos
- Animar sin fallback de `prefers-reduced-motion`
