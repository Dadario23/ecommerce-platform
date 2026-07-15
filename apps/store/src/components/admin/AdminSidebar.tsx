"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantTheme } from "@/config/tenant-themes";
import { useState, useEffect, useMemo } from "react";
import { isAdmin, RECEPTIONIST_ROLES } from "@/lib/roles";
import { TIENDA_ITEMS, TIENDA_UTILITY, SOPORTE_ITEMS, SOPORTE_UTILITY, isNavItemActive } from "./admin-nav";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  repairsEnabled?: boolean;
  logo?: TenantTheme["logo"];
  storeName?: string;
}

export default function AdminSidebar({
  collapsed = false,
  onToggle,
  repairsEnabled = true,
  logo = null,
  storeName = "",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "technician";

  const section: "tienda" | "soporte" = pathname.startsWith("/soporte-tecnico") ? "soporte" : "tienda";
  const canSwitch = repairsEnabled && isAdmin(role);
  const canCreateRepair = RECEPTIONIST_ROLES.includes(role as never);

  const isCatalogActive =
    pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/categories");
  const [catalogOpen, setCatalogOpen] = useState(isCatalogActive);
  useEffect(() => {
    if (isCatalogActive) setCatalogOpen(true);
  }, [isCatalogActive]);

  const items = useMemo(() => {
    const source = section === "tienda" ? TIENDA_ITEMS : SOPORTE_ITEMS;
    return source.filter((item) => !item.roles || item.roles.includes(role));
  }, [section, role]);

  const utilityLinks = section === "tienda" ? TIENDA_UTILITY : SOPORTE_UTILITY;

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
          logo ? (
            <Link href="/" className="relative flex-1 h-9 block">
              <Image
                src={logo.src}
                alt={storeName || "Logo"}
                fill
                className={cn("object-contain object-center", logo.invert && "brightness-0 invert")}
              />
            </Link>
          ) : (
            <Link href="/" className="flex-1 font-brand text-lg text-white uppercase tracking-tight truncate">
              {storeName}
            </Link>
          )
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir sidebar" : "Comprimir sidebar"}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0",
            collapsed && "w-9 h-9",
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Selector de sección: solo si el tenant tiene soporte técnico y el rol accede a ambas */}
      {canSwitch && (
        <div className={cn("pt-3", collapsed ? "px-1.5" : "px-2")}>
          <div className={cn("flex bg-white/5 rounded-lg p-0.5 gap-0.5", collapsed && "flex-col")}>
            <Link
              href="/dashboard"
              title={collapsed ? "Tienda" : undefined}
              className={cn(
                "flex-1 text-center px-2 py-1.5 rounded-md text-xs font-semibold transition-colors truncate",
                section === "tienda" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white",
              )}
            >
              {collapsed ? "T" : "Tienda"}
            </Link>
            <Link
              href="/soporte-tecnico/admin"
              title={collapsed ? "Soporte técnico" : undefined}
              className={cn(
                "flex-1 text-center px-2 py-1.5 rounded-md text-xs font-semibold transition-colors truncate",
                section === "soporte" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white",
              )}
            >
              {collapsed ? "S" : "Soporte técnico"}
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 flex flex-col gap-0.5">
        {items.map((item) => {
          if (!item.children) {
            const active = isNavItemActive(item, pathname);
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
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          }

          // Grupo colapsable (Catálogo de tienda)
          return (
            <div key={item.href}>
              <button
                onClick={collapsed ? onToggle : () => setCatalogOpen((p) => !p)}
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
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                    <ChevronDown
                      className={cn("w-3.5 h-3.5 transition-transform", catalogOpen ? "rotate-180" : "")}
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

        {section === "soporte" && canCreateRepair && !collapsed && (
          <Link
            href="/soporte-tecnico/admin/reparaciones/nueva"
            className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg text-xs font-semibold text-blue-300 hover:text-white hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva reparación
          </Link>
        )}

        {/* Utility links */}
        <div className="mt-auto pt-3 border-t border-white/10 space-y-0.5">
          {utilityLinks.map(({ href, label, icon: Icon }) => (
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
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
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
              onClick={() => signOut({ callbackUrl: section === "soporte" ? "/soporte-tecnico" : "/" })}
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
