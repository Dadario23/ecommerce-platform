import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart2,
  Tag,
  Package,
  List,
  Plus,
  FolderOpen,
  GalleryHorizontal,
  Truck,
  Store,
  Settings,
  Wrench,
  ClipboardCheck,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { ADMIN_ROLES, RECEPTIONIST_ROLES, STAFF_ROLES } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  roles?: readonly string[];
  children?: { href: string; label: string; icon: LucideIcon }[];
}

export const TIENDA_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Órdenes", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/coupons", label: "Cupones", icon: Tag },
  {
    href: "/dashboard/catalog",
    label: "Catálogo",
    icon: Package,
    children: [
      { href: "/dashboard/products", label: "Productos", icon: List },
      { href: "/dashboard/products/new", label: "Nuevo producto", icon: Plus },
      { href: "/dashboard/categories", label: "Categorías", icon: FolderOpen },
      { href: "/dashboard/categories/new", label: "Nueva categoría", icon: Plus },
    ],
  },
  { href: "/dashboard/carousel", label: "Carousel", icon: GalleryHorizontal },
  { href: "/dashboard/shipping", label: "Envíos", icon: Truck },
];

export const TIENDA_UTILITY: NavItem[] = [
  { href: "/", label: "Ver tienda", icon: Store },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export const TIENDA_PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Órdenes",
  "/dashboard/products": "Productos",
  "/dashboard/products/new": "Nuevo producto",
  "/dashboard/categories": "Categorías",
  "/dashboard/categories/new": "Nueva categoría",
  "/dashboard/coupons": "Cupones",
  "/dashboard/customers": "Clientes",
  "/dashboard/analytics": "Analytics",
  "/dashboard/carousel": "Carousel",
  "/dashboard/shipping": "Tarifas de envío",
  "/dashboard/settings": "Configuración",
};

export const SOPORTE_ITEMS: NavItem[] = [
  { href: "/soporte-tecnico/admin", label: "Overview", icon: LayoutDashboard, exact: true, roles: STAFF_ROLES },
  { href: "/soporte-tecnico/admin/reparaciones", label: "Reparaciones", icon: Wrench, exact: false, roles: STAFF_ROLES },
  { href: "/soporte-tecnico/admin/presupuestos", label: "Presupuestos", icon: ClipboardCheck, exact: false, roles: RECEPTIONIST_ROLES },
  { href: "/soporte-tecnico/admin/clientes", label: "Clientes", icon: Users, exact: false, roles: RECEPTIONIST_ROLES },
  { href: "/soporte-tecnico/admin/catalogo", label: "Catálogo", icon: BookOpen, exact: false, roles: ADMIN_ROLES },
  { href: "/soporte-tecnico/admin/reportes", label: "Reportes", icon: BarChart2, exact: false, roles: ADMIN_ROLES },
  { href: "/soporte-tecnico/admin/equipo", label: "Equipo", icon: ShieldCheck, exact: false, roles: ADMIN_ROLES },
];

export const SOPORTE_UTILITY: NavItem[] = [
  { href: "/soporte-tecnico", label: "Ver soporte", icon: Wrench },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.exact === false ? pathname.startsWith(item.href) : pathname === item.href;
}
