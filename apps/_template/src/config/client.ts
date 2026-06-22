// Configuración específica del cliente — EDITAR al crear un nuevo ecommerce
export const CLIENT_CONFIG = {
  // Identidad
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Mi Tienda",
  slug: process.env.NEXT_PUBLIC_CLIENT_SLUG ?? "mi-tienda",
  url: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",

  // Módulos activos (comentar los que no apliquen)
  modules: {
    repairs: false,       // módulo soporte-técnico / reparaciones
    budgets: false,       // módulo presupuestos
    shipping: true,       // configuración de envíos
    coupons: true,        // cupones de descuento
    analytics: true,      // página de analytics en dashboard
  },

  // Apariencia (se puede extender a Tailwind theme)
  theme: {
    primaryColor: "#1E3A8A",
    storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Mi Tienda",
  },

  // Pagos
  mercadoPago: {
    enabled: true,
    transferEnabled: true,
    cashEnabled: true,
  },
} as const;
