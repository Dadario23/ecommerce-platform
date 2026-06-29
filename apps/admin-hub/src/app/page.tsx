type MembershipStatus = "active" | "grace" | "suspended";

interface ClientStats {
  slug: string;
  storeName: string;
  membership: { status: MembershipStatus; paidUntil: string | null; lastPaymentDate: string | null };
  modules: string[];
  productCount: number;
  orderCount: number;
  lastOrderDate: string | null;
}

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "Activo",     color: "#dcfce7", dot: "#16a34a" },
  grace:     { label: "En gracia",  color: "#fef9c3", dot: "#ca8a04" },
  suspended: { label: "Suspendido", color: "#fee2e2", dot: "#dc2626" },
};

async function fetchClients(): Promise<ClientStats[]> {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3100";
  const res = await fetch(`${baseUrl}/api/clients`, {
    headers: { authorization: `Bearer ${process.env.ADMIN_HUB_SECRET}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.clients ?? [];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function DashboardPage() {
  const clients = await fetchClients();

  const active    = clients.filter((c) => c.membership.status === "active").length;
  const grace     = clients.filter((c) => c.membership.status === "grace").length;
  const suspended = clients.filter((c) => c.membership.status === "suspended").length;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
        Panel de Gestión
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""} en la plataforma
      </p>

      {/* Resumen global */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Total clientes",       value: clients.length,  color: "#2563eb" },
          { label: "Activos",              value: active,           color: "#16a34a" },
          { label: "En período de gracia", value: grace,            color: "#ca8a04" },
          { label: "Suspendidos",          value: suspended,        color: "#dc2626" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "20px 24px" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{stat.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla de clientes */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Cliente", "Membresía", "Vence", "Módulos activos", "Productos", "Último pedido", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => {
              const statusCfg = STATUS_CONFIG[client.membership.status];
              return (
                <tr key={client.slug} style={{ borderBottom: i < clients.length - 1 ? "1px solid #f1f5f9" : undefined }}>

                  {/* Cliente */}
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{client.storeName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{client.slug}</p>
                  </td>

                  {/* Membresía */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: statusCfg.color, borderRadius: 9999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.dot, display: "inline-block" }} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Vencimiento */}
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                    {formatDate(client.membership.paidUntil)}
                  </td>

                  {/* Módulos */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {client.modules.length === 0
                        ? <span style={{ fontSize: 12, color: "#94a3b8" }}>Ninguno</span>
                        : client.modules.map((m) => (
                          <span key={m} style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>
                            {m}
                          </span>
                        ))
                      }
                    </div>
                  </td>

                  {/* Productos */}
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569", textAlign: "center" }}>
                    {client.productCount}
                  </td>

                  {/* Último pedido */}
                  <td style={{ padding: "14px 16px", fontSize: 13, color: client.lastOrderDate ? "#475569" : "#94a3b8" }}>
                    {formatDate(client.lastOrderDate)}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "14px 16px" }}>
                    <a href={`/clients/${client.slug}`} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}>
                      Ver detalle →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
