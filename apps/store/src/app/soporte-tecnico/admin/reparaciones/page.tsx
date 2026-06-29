import { getServerSession } from "next-auth";
import { isStaff } from "@/lib/roles";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { ESTADO_LABEL, ESTADO_COLOR, type IReparacion } from "@/models/Reparacion";
import Link from "next/link";
import { Plus, Wrench, ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 0;

const PAGE_SIZE = 15;

const EQUIPO_ICON: Record<string, string> = {
  celular: "📱",
  laptop: "💻",
  pc: "🖥️",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Periodo = "dia" | "semana" | "todas";

function buildDateFilter(periodo: Periodo): object {
  if (periodo === "dia") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }
  if (periodo === "semana") {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }
  return {};
}

export default async function ReparacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user?.role)) redirect("/");
  const canCreate = ["admin", "superadmin", "receptionist"].includes(session.user.role ?? "");

  const { periodo: periodoParam, page: pageParam } = await searchParams;
  const periodo: Periodo = (["dia", "semana", "todas"].includes(periodoParam ?? "")
    ? periodoParam
    : "todas") as Periodo;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { Reparacion } = await getModels();

  const roleFilter = session.user.role === "technician" ? { assignedTo: session.user.id } : {};
  const filter = { ...roleFilter, ...buildDateFilter(periodo) };

  const total = await Reparacion.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const reparaciones = await Reparacion.find(filter)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean<IReparacion[]>();

  function pageHref(p: Periodo, pg: number) {
    return `/soporte-tecnico/admin/reparaciones?periodo=${p}&page=${pg}`;
  }

  const PERIODO_LABELS: Record<Periodo, string> = {
    dia: "Hoy",
    semana: "Esta semana",
    todas: "Todas",
  };

  const emptyMessage: Record<Periodo, string> = {
    dia: "No hay reparaciones registradas hoy",
    semana: "No hay reparaciones esta semana",
    todas: "No hay reparaciones registradas",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reparaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "orden" : "órdenes"}
            {periodo === "dia" && " hoy"}
            {periodo === "semana" && " esta semana"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/soporte-tecnico/admin/reparaciones/nueva"
            className="flex items-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva reparación
          </Link>
        )}
      </div>

      {/* Filtro de período */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["dia", "semana", "todas"] as Periodo[]).map((p) => (
          <Link
            key={p}
            href={pageHref(p, 1)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              periodo === p
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {PERIODO_LABELS[p]}
          </Link>
        ))}
      </div>

      {reparaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{emptyMessage[periodo]}</p>
          {canCreate && periodo === "todas" && (
            <p className="text-sm text-gray-400 mt-1">
              Creá la primera orden desde el botón de arriba.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reparaciones.map((r) => (
                    <tr key={String(r._id)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-(--tenant-primary) text-sm">{r.codigo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.cliente.nombre}</p>
                        <p className="text-xs text-gray-400">{r.cliente.telefono}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-base mr-1.5">{EQUIPO_ICON[r.equipo.tipo] ?? "🔧"}</span>
                        <span className="text-gray-700">{r.equipo.marca} {r.equipo.modelo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[r.estado]}`}>
                          {ESTADO_LABEL[r.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/soporte-tecnico/admin/reparaciones/${String(r._id)}`}
                          className="text-xs font-medium text-(--tenant-primary) hover:underline"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {currentPage} de {totalPages} · {total} órdenes
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={pageHref(periodo, currentPage - 1)}
                  aria-disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    currentPage === 1
                      ? "border-gray-100 text-gray-300 pointer-events-none"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Link>
                <Link
                  href={pageHref(periodo, currentPage + 1)}
                  aria-disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    currentPage === totalPages
                      ? "border-gray-100 text-gray-300 pointer-events-none"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
