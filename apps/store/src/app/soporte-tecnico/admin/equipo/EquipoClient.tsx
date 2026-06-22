"use client";

import { useState } from "react";
import { ShieldCheck, User as UserIcon, Wrench, Search } from "lucide-react";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin:        "Admin",
  superadmin:   "Super Admin",
  receptionist: "Recepcionista",
  technician:   "Técnico",
  user:         "Usuario",
};

const ROLE_STYLE: Record<string, string> = {
  admin:        "bg-purple-100 text-purple-700",
  superadmin:   "bg-purple-100 text-purple-700",
  receptionist: "bg-blue-100 text-blue-700",
  technician:   "bg-amber-100 text-amber-700",
  user:         "bg-gray-100 text-gray-500",
};

const PROMOTABLE_TO: Record<string, { label: string; role: string }[]> = {
  user:         [{ label: "Hacer técnico",        role: "technician"   },
                 { label: "Hacer recepcionista",  role: "receptionist" }],
  technician:   [{ label: "Hacer recepcionista",  role: "receptionist" },
                 { label: "Quitar rol",            role: "user"         }],
  receptionist: [{ label: "Hacer técnico",        role: "technician"   },
                 { label: "Quitar rol",            role: "user"         }],
};

export default function EquipoClient({ users: initial }: { users: StaffUser[] }) {
  const [users, setUsers] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const staff   = users.filter((u) => ["technician", "receptionist"].includes(u.role));
  const regular = users.filter((u) => u.role === "user");

  const filteredRegular = query.trim()
    ? regular.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    : regular;

  async function changeRole(userId: string, role: string) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch {
      alert("Error al cambiar el rol. Intentá de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Staff activo */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Equipo activo · {staff.length}
        </h2>
        {staff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            No hay técnicos ni recepcionistas asignados aún.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {staff.map((u) => (
              <UserRow key={u.id} user={u} loading={loading} onChangeRole={changeRole} />
            ))}
          </div>
        )}
      </div>

      {/* Usuarios regulares */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Usuarios · {regular.length}
        </h2>

        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1E3A8A] placeholder:text-gray-400"
          />
        </div>

        {filteredRegular.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
            <UserIcon className="w-6 h-6 mx-auto mb-1 text-gray-200" />
            {query ? "Sin resultados para esa búsqueda." : "No hay usuarios regulares."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {filteredRegular.map((u) => (
              <UserRow key={u.id} user={u} loading={loading} onChangeRole={changeRole} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  user,
  loading,
  onChangeRole,
}: {
  user: StaffUser;
  loading: string | null;
  onChangeRole: (id: string, role: string) => void;
}) {
  const actions = PROMOTABLE_TO[user.role] ?? [];
  const isLoading = loading === user.id;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
        {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_STYLE[user.role] ?? "bg-gray-100 text-gray-500"}`}>
        {ROLE_LABEL[user.role] ?? user.role}
      </span>
      {actions.length > 0 && (
        <div className="flex gap-1.5 shrink-0">
          {actions.map((action) => (
            <button
              key={action.role}
              onClick={() => onChangeRole(user.id, action.role)}
              disabled={isLoading}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                action.role === "user"
                  ? "text-red-600 border-red-200 hover:bg-red-50"
                  : "text-[#1E3A8A] border-blue-200 hover:bg-blue-50"
              }`}
            >
              {isLoading ? "…" : action.label}
            </button>
          ))}
        </div>
      )}
      {user.role === "admin" || user.role === "superadmin" ? (
        <span className="text-xs text-gray-300 shrink-0 flex items-center gap-1">
          <Wrench className="w-3 h-3" /> protegido
        </span>
      ) : null}
    </div>
  );
}
