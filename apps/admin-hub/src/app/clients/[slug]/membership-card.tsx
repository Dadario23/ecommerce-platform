export type MembershipInfo = {
  status: "active" | "grace" | "suspended";
  paidUntil: Date | null;
  lastPaymentDate: Date | null;
  monthlyPrice: number | null;
};

const STATUS_CONFIG: Record<MembershipInfo["status"], { label: string; color: string; dot: string }> = {
  active:    { label: "Activo",     color: "#dcfce7", dot: "#16a34a" },
  grace:     { label: "En gracia",  color: "#fef9c3", dot: "#ca8a04" },
  suspended: { label: "Suspendido", color: "#fee2e2", dot: "#dc2626" },
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MembershipCard({
  membership,
  priceAction,
  paymentAction,
  suspendAction,
}: {
  membership: MembershipInfo;
  priceAction: (formData: FormData) => Promise<void>;
  paymentAction: () => Promise<void>;
  suspendAction: () => Promise<void>;
}) {
  const statusCfg = STATUS_CONFIG[membership.status];

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Membresía</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
        Estado de la suscripción del cliente a la plataforma.
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: statusCfg.color, borderRadius: 9999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.dot, display: "inline-block" }} />
          {statusCfg.label}
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
          Vence: <strong>{formatDate(membership.paidUntil)}</strong>
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
          Último pago: <strong>{formatDate(membership.lastPaymentDate)}</strong>
        </p>
      </div>

      <form action={priceAction} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
        <label htmlFor="monthlyPrice" style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          Precio mensual (ARS)
        </label>
        <input
          id="monthlyPrice"
          type="number"
          name="monthlyPrice"
          min={0}
          step={1}
          defaultValue={membership.monthlyPrice ?? ""}
          style={{ width: 140, border: "1px solid #cbd5e1", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
        />
        <button
          type="submit"
          style={{
            background: "#2563eb", color: "#fff", border: "none",
            borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Guardar precio
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
        <form action={paymentAction} style={{ margin: 0 }}>
          <button
            type="submit"
            style={{
              background: "#16a34a", color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Registrar pago
          </button>
        </form>
        <form action={suspendAction} style={{ margin: 0 }}>
          <button
            type="submit"
            style={{
              background: "#dc2626", color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Suspender
          </button>
        </form>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          Registrar pago marca activo hasta fin de mes, con gracia hasta el 15 del próximo.
        </p>
      </div>
    </div>
  );
}
