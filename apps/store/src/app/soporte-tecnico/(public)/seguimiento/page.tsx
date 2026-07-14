"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, ChevronRight, Wrench, Lock } from "lucide-react";
import { ESTADO_LABEL, ESTADO_COLOR, EstadoReparacion } from "@/lib/reparacion-config";

interface RepResumen {
  _id: string;
  codigo: string;
  equipo: { tipo: string; marca: string; modelo: string };
  fallas: string[];
  estado: EstadoReparacion;
  createdAt: string;
}

const EQUIPO_ICON: Record<string, string> = { celular: "📱", laptop: "💻", pc: "🖥️" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MisReparacionesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [code, setCode] = useState("");
  const [misReps, setMisReps] = useState<RepResumen[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingReps(true);
    fetch("/api/reparaciones/mis-reparaciones")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMisReps(d))
      .catch(() => {})
      .finally(() => setLoadingReps(false));
  }, [status]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    router.push(`/soporte-tecnico/seguimiento/${clean}`);
  }

  return (
    <main className="pt-20 md:pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto px-4 space-y-5 pt-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis reparaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguí el estado de tu equipo en tiempo real.
          </p>
        </div>

        {/* ── Caso: no logueado ── */}
        {status === "unauthenticated" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-(--tenant-primary)" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Iniciá sesión para ver tus reparaciones</p>
              <p className="text-sm text-gray-400 mt-1">
                Si tenés una cuenta vinculada a tu email, podés ver todos tus equipos en un solo lugar.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* ── Caso: cargando ── */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* ── Caso: logueado ── */}
        {status === "authenticated" && (
          <>
            {loadingReps ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : misReps.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Wrench className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">No tenés equipos en reparación</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Cuando dejés un equipo en el taller, aparecerá acá automáticamente.
                  </p>
                </div>
                <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                  ¿Tenés un código de seguimiento?{" "}
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="text-(--tenant-primary) font-medium hover:underline"
                  >
                    Buscalo acá
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {misReps.map((r) => (
                  <Link
                    key={r._id}
                    href={`/soporte-tecnico/seguimiento/${r.codigo}`}
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-2xl shrink-0">
                      {EQUIPO_ICON[r.equipo.tipo] ?? "🔧"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-(--tenant-primary) text-sm">
                          {r.codigo}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLOR[r.estado]}`}
                        >
                          {ESTADO_LABEL[r.estado]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">
                        {r.equipo.marca} {r.equipo.modelo}
                      </p>
                      {r.fallas.length > 0 && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {r.fallas.slice(0, 2).join(" · ")}
                          {r.fallas.length > 2 && ` · +${r.fallas.length - 2} más`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{fmtDate(r.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-(--tenant-primary) transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Buscar por código (siempre disponible, colapsable) ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Buscar por código de seguimiento
            </span>
            <span className="text-gray-300 text-xs">{searchOpen ? "▲" : "▼"}</span>
          </button>

          {searchOpen && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <form onSubmit={handleSearch} className="flex gap-2 mt-4">
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: CM-0001"
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--tenant-primary) placeholder:text-gray-400 font-mono uppercase"
                />
                <button
                  type="submit"
                  className="bg-(--tenant-primary) hover:bg-blue-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  Buscar
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                El código te lo da el técnico al dejar tu equipo (ej: CM-0001).
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
