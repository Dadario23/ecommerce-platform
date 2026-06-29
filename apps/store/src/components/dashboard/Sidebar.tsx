"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Plus,
  List,
  Users,
  BarChart2,
  Settings,
  GalleryHorizontal,
  Truck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";

interface NavChild {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Tienda",
    items: [
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
    ],
  },
  {
    label: "Soporte técnico",
    items: [
      { href: "/soporte-tecnico/admin", label: "Panel soporte", icon: Wrench },
    ],
  },
];

const UTILITY_LINKS = [
  { href: "/", label: "Ver tienda", icon: Store },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const repairsEnabled = useMemo(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.getAttribute("data-module-repairs") === "1";
  }, []);

  const visibleSections = useMemo(
    () => NAV_SECTIONS.filter((s) => s.label !== "Soporte técnico" || repairsEnabled),
    [repairsEnabled],
  );

  const isCatalogActive =
    pathname.startsWith("/dashboard/products") ||
    pathname.startsWith("/dashboard/categories");

  const [catalogOpen, setCatalogOpen] = useState(isCatalogActive);

  useEffect(() => {
    if (isCatalogActive) setCatalogOpen(true);
  }, [isCatalogActive]);

  const initials = (session?.user?.name || "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "h-screen bg-slate-900 flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-white/10 shrink-0 gap-3",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        {!collapsed && (
          <div className="relative flex-1 h-9">
            <Image
              src="/logo.svg"
              alt="Logo"
              fill
              className="object-contain object-center brightness-0 invert"
            />
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir sidebar" : "Comprimir sidebar"}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0",
            collapsed && "w-9 h-9",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 flex flex-col gap-5">
        {visibleSections.map((section, si) => (
          <div key={section.label}>
            {collapsed ? (
              si > 0 && <div className="mb-1.5 border-t border-white/10" />
            ) : (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                {section.label}
              </p>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (!item.children) {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>
                  );
                }

                // Collapsible group (Catálogo)
                return (
                  <div key={item.href}>
                    <button
                      onClick={
                        collapsed
                          ? onToggle
                          : () => setCatalogOpen((p) => !p)
                      }
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        collapsed && "justify-center px-2",
                        isCatalogActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left whitespace-nowrap">
                            {item.label}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform",
                              catalogOpen ? "rotate-180" : "",
                            )}
                          />
                        </>
                      )}
                    </button>

                    {catalogOpen && !collapsed && (
                      <div className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              pathname === child.href
                                ? "text-white bg-white/10"
                                : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                          >
                            <child.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Utility links */}
        <div className="mt-auto pt-3 border-t border-white/10 space-y-0.5">
          {UTILITY_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                pathname === href
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
              title={session?.user?.name || "Admin"}
            >
              {initials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate whitespace-nowrap">
                {session?.user?.name?.split(" ")[0] || "Admin"}
              </p>
              <p className="text-slate-500 text-[10px] truncate whitespace-nowrap">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
