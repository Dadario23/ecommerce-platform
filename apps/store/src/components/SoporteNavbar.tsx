"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wrench, Menu, X, LogOut, UserCircle, ClipboardList, LayoutDashboard } from "lucide-react";
import { isAdmin, isStaff } from "@/lib/roles";
import { useState } from "react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/soporte-tecnico",             label: "Inicio",           exact: true  },
  { href: "/soporte-tecnico/seguimiento", label: "Mis reparaciones", exact: false },
];

export default function SoporteNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-900 border-b border-white/10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">

          {/* Logo + sección */}
          <Link href="/" className="flex items-center shrink-0">
            <div className="relative w-28 h-7 shrink-0">
              <Image
                src="/logo.svg"
                alt="Compumobile"
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
          </Link>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {session?.user && <NotificationBell />}

            {/* Usuario logueado → dropdown */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-slate-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="hidden sm:block text-xs font-medium max-w-24 truncate">
                      {session.user.name?.split(" ")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-gray-500 font-normal truncate">
                    {session.user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      Mi perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                      Mis compras
                    </Link>
                  </DropdownMenuItem>
                  {isStaff(session.user?.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/soporte-tecnico/admin" className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600 font-medium">Admin soporte</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin(session.user?.role) && (
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">Dashboard tienda</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/soporte-tecnico" })}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* No logueado → botón Ingresar */
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserCircle className="w-3.5 h-3.5" />
                Ingresar
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen((p) => !p)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900 px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {label}
                </Link>
              );
            })}

            <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
              {session?.user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-slate-400 text-xs">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium text-sm truncate">{session.user.name}</p>
                      <p className="truncate text-[11px]">{session.user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/account/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    Mi perfil
                  </Link>
                  {isStaff(session.user?.role) && (
                    <Link
                      href="/soporte-tecnico/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors"
                    >
                      <Wrench className="w-4 h-4" />
                      Admin soporte
                    </Link>
                  )}
                  {isAdmin(session.user?.role) && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard tienda
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/soporte-tecnico" }); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
