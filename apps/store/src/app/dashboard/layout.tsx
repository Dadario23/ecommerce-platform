"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { Menu, X, Store, LogOut } from "lucide-react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([key]) =>
      key === pathname || pathname.startsWith(key + "/")
    )?.[1] ?? "Dashboard";

  const initials = (session?.user?.name || "A")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex sticky top-0 h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((p) => !p)}
        />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex">
            <Sidebar />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-gray-800">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-(--tenant-primary) font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Ver tienda
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full bg-(--tenant-primary) flex items-center justify-center text-white text-[10px] font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-medium text-gray-700 max-w-24 truncate">
                {session?.user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
