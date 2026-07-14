"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import PromoBar from "@/components/PromoBar";
import { useState } from "react";
import {
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  LayoutDashboard,
  ClipboardList,
  Lock,
  ChevronRight,
  Wrench,
  UserCircle,
  Heart,
  Store,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavbarSearch from "./NavbarSearch";
import NotificationBell from "./NotificationBell";
import { useSession, signOut } from "next-auth/react";
import { useCartWithSession } from "@/hooks/useCartWithSession";
import { useCartUI } from "@/store/useCartUI";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesSync } from "@/hooks/useFavoritesSync";
import Image from "next/image";
import type { TenantTheme } from "@/config/tenant-themes";
import { isAdmin, isStaff } from "@/lib/roles";

interface Category {
  _id: string;
  name: string;
  slug?: string;
}

const SOPORTE_LINKS = [
  { href: "/soporte-tecnico", label: "Inicio", exact: true },
  { href: "/soporte-tecnico/seguimiento", label: "Mis reparaciones", exact: false },
];

function getSlug(cat: Category) {
  return (
    cat.slug ||
    cat.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export default function Navbar({
  initialCategories = [],
  showRepairs = false,
  storeName,
  logo,
  navStyle = "solid",
  promoItems,
}: {
  initialCategories?: Category[];
  showRepairs?: boolean;
  storeName: string;
  logo: TenantTheme["logo"];
  navStyle?: TenantTheme["navStyle"];
  promoItems: TenantTheme["promoItems"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const inSoporte = pathname.startsWith("/soporte-tecnico");

  const { isLoading } = useCartWithSession();
  const itemsCount = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const { toggle } = useCartUI();
  useFavoritesSync();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const light = navStyle === "light";
  const iconBtn = light
    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    : "text-white/90 hover:text-white hover:bg-white/10";

  const goToCategory = (cat: Category) => {
    setMobileMenuOpen(false);
    router.push(`/category/${getSlug(cat)}`);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50">
        {/* ── TOP BAR ── */}
        <div className={light ? "bg-background bg-pattern border-b border-gray-200" : "bg-(--tenant-primary)"}>
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 py-3 md:py-3.5">
            {/* Mobile: hamburger */}
            <button
              className={`md:hidden ${light ? "text-gray-700 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo o wordmark */}
            <Link href="/" className="shrink-0">
              {logo ? (
                <Image
                  src={logo.src}
                  alt={storeName || "logo"}
                  width={160}
                  height={38}
                  priority
                  className={`h-9.5 w-auto ${logo.invert && !light ? "brightness-0 invert" : ""}`}
                />
              ) : (
                <span
                  className={`font-brand text-2xl tracking-tight ${
                    light ? "text-gray-900 uppercase" : "text-(--tenant-on-primary)"
                  }`}
                >
                  {storeName}
                </span>
              )}
            </Link>

            {/* Search — desktop */}
            <div className="hidden md:flex flex-1 mx-4">
              <NavbarSearch light={light} />
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1 md:gap-3">
              {/* Mobile: search toggle */}
              <button
                className={`md:hidden p-2 rounded-full transition-colors ${iconBtn}`}
                onClick={() => setMobileSearchOpen((p) => !p)}
              >
                {mobileSearchOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>

              {/* User */}
              {!session ? (
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 text-sm font-medium px-2 py-1.5 rounded-lg transition-colors ${iconBtn}`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">Ingresar</span>
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-1.5 text-sm font-medium px-2 py-1.5 rounded-lg transition-colors ${iconBtn}`}>
                      <div className="w-7 h-7 rounded-full bg-(--tenant-accent) flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(session.user?.name || "U")[0].toUpperCase()}
                      </div>
                      <span className="hidden md:inline max-w-25 truncate">
                        {session.user?.name?.split(" ")[0] || "Usuario"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                      {session.user?.email}
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

                    <DropdownMenuItem asChild>
                      <Link href="/account/favorites" className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-gray-400" />
                        Mis favoritos
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/account/change-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        Cambiar contraseña
                      </Link>
                    </DropdownMenuItem>

                    {(isStaff(session.user?.role) && showRepairs) || isAdmin(session.user?.role) ? (
                      <>
                        <DropdownMenuSeparator />
                        {isStaff(session.user?.role) && showRepairs && (
                          <DropdownMenuItem asChild>
                            <Link href="/soporte-tecnico/admin" className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-(--tenant-primary)" />
                              <span className="text-(--tenant-primary) font-medium">Admin soporte</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isAdmin(session.user?.role) && (
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                              <LayoutDashboard className="w-4 h-4 text-(--tenant-primary)" />
                              <span className="text-(--tenant-primary) font-medium">Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : null}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Favorites — desktop only; mobile has it in the drawer */}
              {session && (
                <Link
                  href="/account/favorites"
                  className={`hidden md:flex relative p-2 rounded-full transition-colors ${iconBtn}`}
                  aria-label="Mis favoritos"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Notifications */}
              {session && <NotificationBell />}

              {/* Cart */}
              <button
                onClick={toggle}
                disabled={isLoading}
                className={`relative p-2 rounded-full transition-colors ${iconBtn}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {!isLoading && itemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {itemsCount > 99 ? "99+" : itemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE SEARCH ── */}
        {mobileSearchOpen && (
          <div
            className={`md:hidden px-4 pb-3 ${
              light ? "bg-background bg-pattern border-b border-gray-200" : "bg-(--tenant-primary-hover)"
            }`}
          >
            <NavbarSearch light={light} />
          </div>
        )}

        {/* ── CATEGORY BAR (desktop) ── */}
        <nav className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className={`flex items-center overflow-x-auto scrollbar-none ${light ? "gap-2 justify-center" : "gap-1"}`}>
              {inSoporte ? (
                <>
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap text-sm text-gray-600 hover:text-(--tenant-primary) hover:bg-(--tenant-tint) font-medium transition-colors rounded-md shrink-0"
                  >
                    <Store className="w-3.5 h-3.5" />
                    Tienda
                  </Link>
                  <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
                  {SOPORTE_LINKS.map(({ href, label, exact }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`px-3.5 py-2.5 whitespace-nowrap text-sm font-medium transition-colors rounded-md shrink-0 ${
                          active
                            ? "text-(--tenant-primary) bg-(--tenant-tint)"
                            : "text-gray-600 hover:text-(--tenant-primary) hover:bg-(--tenant-tint)"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </>
              ) : (
                <>
                  {initialCategories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => goToCategory(cat)}
                      className={
                        light
                          ? "px-3.5 py-3 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-(--tenant-accent) transition-colors shrink-0"
                          : "px-3.5 py-2.5 whitespace-nowrap text-sm text-gray-600 hover:text-(--tenant-primary) hover:bg-(--tenant-tint) font-medium transition-colors rounded-md shrink-0"
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                  {showRepairs && (
                    <>
                      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
                      <Link
                        href="/soporte-tecnico"
                        className="flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap text-sm text-(--tenant-primary) hover:bg-(--tenant-tint) font-semibold transition-colors rounded-md shrink-0"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Soporte Técnico
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
        {/* ── PROMO BAR — solo en páginas de producto ── */}
        {pathname.startsWith("/products/") && <PromoBar items={promoItems} />}
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-60 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Panel */}
          <div
            className="relative w-72 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="bg-(--tenant-primary) px-4 py-5 flex items-center justify-between shrink-0">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-(--tenant-accent) flex items-center justify-center text-white font-bold text-base">
                    {(session.user?.name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">
                      {session.user?.name?.split(" ")[0] || "Usuario"}
                    </p>
                    <p className="text-(--tenant-on-primary)/70 text-xs truncate max-w-40">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-white font-semibold text-sm"
                >
                  <User className="w-5 h-5" />
                  Iniciar sesión
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories list */}
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {inSoporte ? "Soporte técnico" : "Categorías"}
              </p>
              <ul className="divide-y divide-gray-100">
                {inSoporte ? (
                  <>
                    <li>
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-(--tenant-tint) hover:text-(--tenant-primary) transition-colors text-left"
                      >
                        <span className="flex items-center gap-3">
                          <Store className="w-4 h-4 text-gray-400" />
                          Tienda
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </Link>
                    </li>
                    {SOPORTE_LINKS.map(({ href, label, exact }) => {
                      const active = exact ? pathname === href : pathname.startsWith(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${
                              active
                                ? "bg-(--tenant-tint) text-(--tenant-primary) font-semibold"
                                : "text-gray-700 hover:bg-(--tenant-tint) hover:text-(--tenant-primary)"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <Wrench className="w-4 h-4 text-gray-400" />
                              {label}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {initialCategories.map((cat) => (
                      <li key={cat._id}>
                        <button
                          onClick={() => goToCategory(cat)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-(--tenant-tint) hover:text-(--tenant-primary) transition-colors text-left"
                        >
                          {cat.name}
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        </button>
                      </li>
                    ))}
                    {showRepairs && (
                      <li>
                        <Link
                          href="/soporte-tecnico"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-(--tenant-primary) font-semibold hover:bg-(--tenant-tint)"
                        >
                          <Wrench className="w-4 h-4" />
                          Soporte Técnico
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>

              {/* Account links */}
              {session && (
                <>
                  <p className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Mi cuenta
                  </p>
                  <ul className="divide-y divide-gray-100">
                    <li>
                      <Link
                        href="/account/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-(--tenant-tint)"
                      >
                        <UserCircle className="w-4 h-4 text-gray-400" />
                        Mi perfil
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-(--tenant-tint)"
                      >
                        <ClipboardList className="w-4 h-4 text-gray-400" />
                        Mis compras
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-(--tenant-tint)"
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        Mis favoritos
                      </Link>
                    </li>
                    {isStaff(session.user?.role) && showRepairs && (
                      <li>
                        <Link
                          href="/soporte-tecnico/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-(--tenant-primary) font-medium hover:bg-(--tenant-tint)"
                        >
                          <Wrench className="w-4 h-4" />
                          Admin soporte
                        </Link>
                      </li>
                    )}
                    {isAdmin(session.user?.role) && (
                      <li>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-(--tenant-primary) font-medium hover:bg-(--tenant-tint)"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>

            {/* Drawer footer */}
            {session && (
              <div className="border-t px-4 py-4 shrink-0">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-600 font-medium rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
