import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/roles";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { ESTADO_LABEL, type IReparacion } from "@/models/Reparacion";

export const revalidate = 0;

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) redirect("/");

  const { Reparacion, Presupuesto } = await getModels();

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [reparaciones, presupuestosPendientes] = await Promise.all([
    Reparacion.find().lean<IReparacion[]>(),
    Presupuesto.countDocuments({ estado: "pendiente" }),
  ]);

  const porEstado: Record<string, number> = {
    recibido:    reparaciones.filter((r) => r.estado === "recibido").length,
    en_reparacion: reparaciones.filter((r) => r.estado === "en_reparacion").length,
    listo:       reparaciones.filter((r) => r.estado === "listo").length,
    entregado:   reparaciones.filter((r) => r.estado === "entregado").length,
  };

  const esteMes    = reparaciones.filter((r) => new Date(r.createdAt) >= inicioMes).length;
  const mesAnterior = reparaciones.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= inicioMesAnterior && d < inicioMes;
  }).length;

  const diff = esteMes - mesAnterior;
  const diffSign = diff > 0 ? "+" : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Métricas del módulo de soporte técnico</p>
      </div>

      {/* Mes actual vs anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Este mes</p>
          <p className="text-3xl font-bold text-gray-900">{esteMes}</p>
          <p className="text-xs text-gray-400 mt-1">reparaciones ingresadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Mes anterior</p>
          <p className="text-3xl font-bold text-gray-900">{mesAnterior}</p>
          <p className="text-xs text-gray-400 mt-1">reparaciones ingresadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Variación</p>
          <p className={`text-3xl font-bold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
            {diffSign}{diff}
          </p>
          <p className="text-xs text-gray-400 mt-1">respecto al mes anterior</p>
        </div>
      </div>

      {/* Por estado */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Distribución por estado</p>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(porEstado).map(([estado, count]) => {
            const pct = reparaciones.length > 0 ? Math.round((count / reparaciones.length) * 100) : 0;
            return (
              <div key={estado} className="px-5 py-4 flex items-center gap-4">
                <p className="text-sm font-medium text-gray-700 w-36 shrink-0">{ESTADO_LABEL[estado as keyof typeof ESTADO_LABEL]}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-gray-900 w-8 text-right shrink-0">{count}</p>
                <p className="text-xs text-gray-400 w-10 shrink-0">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Presupuestos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <span className="text-xl">📋</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{presupuestosPendientes}</p>
          <p className="text-xs text-gray-500 mt-0.5">presupuestos pendientes de revisión</p>
        </div>
      </div>
    </div>
  );
}
