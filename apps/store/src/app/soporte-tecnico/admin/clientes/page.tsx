import { getServerSession } from "next-auth";
import { isReceptionist } from "@/lib/roles";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { type IReparacion } from "@/models/Reparacion";
import Link from "next/link";
import { Users } from "lucide-react";

export const revalidate = 0;

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isReceptionist(session.user?.role)) redirect("/");

  const { Reparacion } = await getModels();
  const reparaciones = await Reparacion.find()
    .sort({ createdAt: -1 })
    .lean<IReparacion[]>();

  // Agrupar por email si existe, sino por nombre+teléfono
  const map = new Map<string, {
    nombre: string;
    telefono: string;
    email?: string;
    count: number;
    ultima: Date | string;
    ids: string[];
  }>();

  for (const r of reparaciones) {
    const key = r.cliente.email?.toLowerCase() || `${r.cliente.nombre}|${r.cliente.telefono}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.ids.push(String(r._id));
    } else {
      map.set(key, {
        nombre: r.cliente.nombre,
        telefono: r.cliente.telefono,
        email: r.cliente.email,
        count: 1,
        ultima: r.createdAt,
        ids: [String(r._id)],
      });
    }
  }

  const clientes = Array.from(map.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Clientes de soporte</h1>
        <p className="text-sm text-gray-500 mt-0.5">{clientes.length} clientes únicos</p>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay clientes aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reparaciones</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Última</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.nombre}</p>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">{c.telefono}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {c.count} {c.count === 1 ? "orden" : "órdenes"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell whitespace-nowrap">{fmtDate(c.ultima)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/soporte-tecnico/admin/reparaciones/${c.ids[0]}`}
                        className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Ver última →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
