"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Wrench,
  ClipboardCheck,
  BookOpen,
  Users,
  BarChart2,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

const ALL_NAV_ITEMS = [
  { href: "/soporte-tecnico/admin",              label: "Overview",      icon: LayoutDashboard, exact: true,  roles: ["admin","superadmin","receptionist","technician"] },
  { href: "/soporte-tecnico/admin/reparaciones", label: "Reparaciones",  icon: Wrench,          exact: false, roles: ["admin","superadmin","receptionist","technician"] },
  { href: "/soporte-tecnico/admin/presupuestos", label: "Presupuestos",  icon: ClipboardCheck,  exact: false, roles: ["admin","superadmin","receptionist"] },
  { href: "/soporte-tecnico/admin/clientes",     label: "Clientes",      icon: Users,           exact: false, roles: ["admin","superadmin","receptionist"] },
  { href: "/soporte-tecnico/admin/catalogo",     label: "Catálogo",      icon: BookOpen,        exact: false, roles: ["admin","superadmin"] },
  { href: "/soporte-tecnico/admin/reportes",     label: "Reportes",      icon: BarChart2,       exact: false, roles: ["admin","superadmin"] },
  { href: "/soporte-tecnico/admin/equipo",       label: "Equipo",        icon: ShieldCheck,     exact: false, roles: ["admin","superadmin"] },
];

function Sidebar({ collapsed, onToggle, role }: { collapsed: boolean; onToggle: () => void; role: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = (session?.user?.name || "A")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const canCreate = ["admin", "superadmin", "receptionist"].includes(role);

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
          <Link href="/" className="relative flex-1 h-9 block">
            <Image
              src="/logo.svg"
              alt="logo"
              fill
              className="object-contain object-center brightness-0 invert"
            />
          </Link>
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 flex flex-col gap-1">
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
            Soporte técnico
          </p>
        )}

        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}

          {canCreate && !collapsed && (
            <Link
              href="/soporte-tecnico/admin/reparaciones/nueva"
              className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg text-xs font-semibold text-blue-300 hover:text-white hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva reparación
            </Link>
          )}
        </div>

        {/* Utility links */}
        <div className="mt-auto pt-3 border-t border-white/10 space-y-0.5">
          <Link
            href="/soporte-tecnico"
            title={collapsed ? "Ver soporte" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors",
              collapsed && "justify-center px-2",
            )}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Ver soporte</span>}
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
              title={session?.user?.name || ""}
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
                {session?.user?.name?.split(" ")[0] || ""}
              </p>
              <p className="text-slate-500 text-[10px] truncate whitespace-nowrap">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/soporte-tecnico" })}
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

export default function SoporteAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role ?? "technician";

  const initials = (session?.user?.name || "A")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pageTitle =
    ALL_NAV_ITEMS.find(({ href, exact }) =>
      exact ? pathname === href : pathname.startsWith(href),
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex sticky top-0 h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} role={role} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative flex">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} role={role} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Menu className="w-5 h-5" />
            </button>
            {/* Logo en mobile (sidebar oculto) */}
            <Link href="/" className="lg:hidden relative w-32 h-7 shrink-0">
              <Image
                src="/logo.svg"
                alt="logo"
                fill
                className="object-contain object-left"
              />
            </Link>
            <h1 className="hidden lg:block text-sm font-semibold text-gray-800">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell buttonClassName="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors" />
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full bg-(--tenant-primary) flex items-center justify-center text-white text-[10px] font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-medium text-gray-700 max-w-24 truncate">
                {session?.user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/soporte-tecnico" })}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
