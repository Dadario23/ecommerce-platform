type MembershipStatus = "active" | "grace" | "suspended";

interface ClientStats {
  slug: string;
  storeName: string;
  orders: { total: number; pending: number };
  revenue: { total: number; thisMonth: number };
  membership: { status: MembershipStatus; paidUntil: string | null; lastPaymentDate: string | null };
}

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "Activo",    color: "#dcfce7", dot: "#16a34a" },
  grace:     { label: "Gracia",    color: "#fef9c3", dot: "#ca8a04" },
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

function formatCurrency(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export default async function DashboardPage() {
  const clients = await fetchClients();

  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue.thisMonth, 0);
  const totalPending = clients.reduce((sum, c) => sum + c.orders.pending, 0);
  const suspended = clients.filter((c) => c.membership.status === "suspended").length;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
        Panel de Gestión
      </h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>{clients.length} clientes activos en la plataforma</p>

      {/* Resumen global */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Facturación del mes", value: formatCurrency(totalRevenue) },
          { label: "Pedidos pendientes", value: totalPending },
          { label: "Clientes suspendidos", value: suspended },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "20px 24px" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{stat.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla de clientes */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Cliente", "Membresía", "Pedidos pendientes", "Facturación del mes", "Total histórico", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => {
              const statusCfg = STATUS_CONFIG[client.membership.status];
              return (
                <tr key={client.slug} style={{ borderBottom: i < clients.length - 1 ? "1px solid #f1f5f9" : undefined }}>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>{client.storeName}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: statusCfg.color, borderRadius: 9999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.dot, display: "inline-block" }} />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: client.orders.pending > 0 ? "#dc2626" : "#64748b", fontWeight: client.orders.pending > 0 ? 700 : 400 }}>
                    {client.orders.pending}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#0f172a" }}>{formatCurrency(client.revenue.thisMonth)}</td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatCurrency(client.revenue.total)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <a href={`/clients/${client.slug}`} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Ver detalle →</a>
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
