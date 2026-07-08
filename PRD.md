# PRD.md — ecommerce-platform

> Qué hace el producto y por qué. El cómo técnico vive en
> [ARCHITECTURE.md](./ARCHITECTURE.md); los estándares de UI en
> [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); las reglas de trabajo en
> [CLAUDE.md](./CLAUDE.md).

---

## Visión

Plataforma SaaS **multi-tenant** de e-commerce para comercios argentinos. El
operador (dueño de la plataforma) da de alta tiendas independientes — cada una
con su dominio, su base de datos, su branding y sus módulos — sobre **un único
deployment**. Objetivo: 40+ clientes sin infraestructura nueva por cliente.

El negocio es de largo plazo: el operador vive de esto. Robustez, aislamiento
entre tenants y cero fugas de seguridad valen más que features nuevas.

---

## Roles

| Rol                    | Quién             | Acceso                                                                  |
| ---------------------- | ----------------- | ----------------------------------------------------------------------- |
| Operador de plataforma | El dueño          | `admin-hub`: métricas cross-tenant, membresías, alta de clientes        |
| `admin` / `superadmin` | Staff del cliente | Panel admin de su propia tienda (productos, órdenes, cupones, settings) |
| `receptionist`         | Staff del cliente | Alta y gestión de reparaciones                                          |
| `technician`           | Staff del cliente | Reparaciones asignadas a él                                             |
| `user`                 | Consumidor final  | Storefront, su cuenta, sus compras                                      |

---

## Tenants actuales

| Tenant        | Rubro                         | Dominio                | Módulos extra    |
| ------------- | ----------------------------- | ---------------------- | ---------------- |
| `bitm-cel`    | Tecnología + servicio técnico | bitm-cel.com.ar        | repairs          |
| `kameleba`    | Moda                          | kameleba.com.ar        | —                |
| `compumobile` | Tecnología + servicio técnico | www.compumobile.com.ar | repairs, budgets |

Módulos activables por tenant (doc `Setting`): `repairs`, `budgets`,
`shipping`, `coupons`. El alta de un cliente nuevo está documentada en
CLAUDE.md ("Agregar un nuevo cliente").

---

## Membresía y facturación

El operador cobra a cada cliente por el servicio. La membresía vive en la DB
del tenant (colección `memberships`), la **escribe solo admin-hub** y el store
la lee para decidir si la tienda opera.

### Estados efectivos

```
active ──(vence paidUntil)──▶ grace ──(vence gracePeriodEnd / día 15)──▶ suspended
   ▲                                                                        │
   └──────────────────── operador registra pago / reactiva ◀────────────────┘
```

- **active** — al día, o sin doc de membresía (default benevolente)
- **grace** — vencido pero dentro de la gracia; la tienda opera normal
- **suspended** — el storefront muestra "tienda fuera de servicio" (implementado
  en el layout de store); un error de lectura nunca suspende

### Ciclo

Activación en cualquier día del mes → `paidUntil` = fin de ese mes →
`gracePeriodEnd` = día 15 del mes siguiente.

### Limitaciones actuales (deliberadas)

- El operador suspende/activa manualmente — sin trigger automático al vencer la gracia
- Pagos registrados a mano en admin-hub — sin gateway para cobrar membresías
- Registro de tenants estático por env vars

---

## Features de la tienda (todos los tenants)

### Cuentas

- Registro/login con email y contraseña, y Google OAuth
- Reset de contraseña por email con token que expira; rate limiting en
  login/registro/reset
- Datos: nombre, email, direcciones múltiples (con default), favoritos,
  historial de pedidos y notificaciones in-app

### Catálogo

- Producto: nombre, slug único, descripción, imágenes (Cloudinary), precio,
  precio de comparación, marca, categoría, stock, condición, envío, activo
- Búsqueda por texto, filtros por categoría/precio, orden y paginación
- Sin stock: visible pero no comprable
- Reviews con rating solo de compradores (verificadas contra sus órdenes)

### Carrito y checkout

- Carrito persistente por usuario (DB) con estado cliente en Zustand
- Cupones: porcentaje o monto fijo, mínimo de orden, límite de usos, expiración;
  el descuento se recalcula siempre server-side
- **Tres métodos de pago:** Mercado Pago (redirect), transferencia (alias/CVU
  del tenant) y contraentrega
- Stock: reserva atómica en checkout; MP reserva por 45 min (preferencia expira
  a los 30); reservas abandonadas se liberan solas
- Zonas de envío configurables por tenant (módulo `shipping`)

### Órdenes

Estados: `pending → confirmed → processing → shipped → delivered`, más
`cancelled`. El pago tiene su propio estado (`pending / completed / failed /
refunded`).

- El cliente cancela solo en `pending`/`confirmed`; cancelar devuelve stock y cupón
- El admin cambia estados; des-cancelar re-reserva stock (falla si ya no hay)
- Todo cambio de estado notifica por email + notificación in-app
- Las órdenes no se borran: se cancelan

### Servicio técnico (módulo `repairs` — bitm-cel y compumobile)

Estados: `recibido → diagnosticado → en_reparacion → esperando_repuestos →
listo → entregado`, más `cancelado` y `sin_reparacion`.

- Alta por staff (`receptionist`+); presupuesto con aprobación del cliente
- Seguimiento público por código, sin login
- Catálogo de reparaciones con precios por equipo/marca/modelo (celular,
  laptop, pc) para cotización
- Cambios de estado notifican por email + in-app

### Presupuestos (módulo `budgets` — compumobile)

- Solicitud pública de presupuesto; gestión y respuesta desde el panel admin

---

## Reglas de negocio

- Precios en **pesos argentinos (ARS)**; formato `$ 1.234,50`
- Copy en español rioplatense (voseo)
- El descuento de cupón y los totales se calculan siempre en el server
- `usedCount` de cupón se cuenta al confirmarse el pago (MP) o al crear la
  orden (otros métodos); cancelar lo devuelve
- Mercado Pago cobra un ítem único con el total cuando hay descuento
  (Checkout Pro no admite ítems negativos)
- Credenciales de MP, remitente de email y datos de transferencia son **por
  tenant** (Setting), con fallback a las credenciales del operador

---

## Fuera de alcance (versión actual)

- Multi-moneda y multi-idioma
- Variantes de producto por atributos (talle/color) — planificado para kameleba
- POS / integración con local físico
- Suscripciones o pagos recurrentes
- Apps móviles nativas (web responsive solamente)
- Cobro automático de membresías a los clientes

---

## Métricas de éxito

| Métrica                        | Objetivo                      |
| ------------------------------ | ----------------------------- |
| Conversión de checkout         | > 3% de sesiones              |
| LCP mobile 4G                  | < 2.5s                        |
| Uptime                         | 99.9% mensual                 |
| Onboarding de un cliente nuevo | < 1 día, sin deployment nuevo |
