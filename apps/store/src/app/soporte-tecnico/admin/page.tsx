import { getServerSession } from "next-auth";
import { isStaff } from "@/lib/roles";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { ESTADO_LABEL, ESTADO_COLOR, type IReparacion } from "@/models/Reparacion";
import Link from "next/link";
import { Wrench, ClipboardCheck, Users, CheckCircle2 } from "lucide-react";

export const revalidate = 0;

const EQUIPO_ICON: Record<string, string> = { celular: "📱", laptop: "💻", pc: "🖥️" };

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function SoporteAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user?.role)) redirect("/");

  const { Reparacion, Presupuesto } = await getModels();

  const [reparaciones, presupuestosPendientes] = await Promise.all([
    Reparacion.find().sort({ createdAt: -1 }).limit(200).lean<IReparacion[]>(),
    Presupuesto.countDocuments({ estado: "pendiente" }),
  ]);

  const total      = reparaciones.length;
  const enProceso  = reparaciones.filter((r) => r.estado === "en_reparacion").length;
  const listas     = reparaciones.filter((r) => r.estado === "listo").length;
  const entregadas = reparaciones.filter((r) => r.estado === "entregado").length;
  const clientes   = new Set(reparaciones.map((r) => r.cliente.email || r.cliente.telefono)).size;
  const recientes  = reparaciones.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reparaciones" value={total}               icon={<Wrench className="w-5 h-5 text-blue-500" />}   />
        <StatCard label="En proceso"   value={enProceso}           icon={<Wrench className="w-5 h-5 text-amber-500" />}  />
        <StatCard label="Listas"       value={listas}              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
        <StatCard label="Clientes"     value={clientes}            icon={<Users className="w-5 h-5 text-purple-500" />}  />
      </div>

      {presupuestosPendientes > 0 && (
        <Link
          href="/soporte-tecnico/admin/presupuestos"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 hover:bg-amber-100 transition-colors"
        >
          <ClipboardCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">
            {presupuestosPendientes} presupuesto{presupuestosPendientes > 1 ? "s" : ""} pendiente{presupuestosPendientes > 1 ? "s" : ""} de revisión
          </span>
          <span className="ml-auto text-amber-600 text-sm">Ver →</span>
        </Link>
      )}

      {/* Últimas reparaciones */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Últimas reparaciones</p>
          <Link href="/soporte-tecnico/admin/reparaciones" className="text-xs text-blue-600 hover:underline font-medium">
            Ver todas →
          </Link>
        </div>
        {recientes.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No hay reparaciones aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Equipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recientes.map((r) => (
                  <tr key={String(r._id)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 text-sm">{r.codigo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.cliente.nombre}</p>
                      <p className="text-xs text-gray-400">{r.cliente.telefono}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                      {EQUIPO_ICON[r.equipo.tipo] ?? "🔧"} {r.equipo.marca} {r.equipo.modelo}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[r.estado]}`}>
                        {ESTADO_LABEL[r.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/soporte-tecnico/admin/reparaciones/${String(r._id)}`} className="text-xs font-medium text-blue-600 hover:underline">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
