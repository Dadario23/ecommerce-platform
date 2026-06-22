"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, MapPin, Lock, LogOut, ChevronRight, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/account/profile", label: "Mi perfil", icon: User },
  { href: "/account/orders", label: "Mis compras", icon: ClipboardList },
  { href: "/account/addresses", label: "Direcciones", icon: MapPin },
  { href: "/account/change-password", label: "Cambiar contraseña", icon: Lock },
];

export default function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (!session) {
    return (
      <div className="pt-20 md:pt-32 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">
            Iniciá sesión para ver tu cuenta
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  const initials = (session.user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">

        {/* Mobile: horizontal tab bar */}
        <div className="md:hidden flex overflow-x-auto gap-1 mb-4 pb-1 scrollbar-none">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">

          {/* Sidebar desktop */}
          <aside className="hidden md:flex flex-col gap-3">
            {/* User card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-base shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {session.user?.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                      active
                        ? "bg-blue-50 text-[#1E3A8A]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? "text-[#1E3A8A]" : "text-gray-400"}`} />
                      {label}
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                  </Link>
                );
              })}

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
