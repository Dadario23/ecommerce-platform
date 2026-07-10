export type Modules = {
  modules_repairs: boolean;
  modules_budgets: boolean;
  modules_shipping: boolean;
  modules_coupons: boolean;
  modules_analytics: boolean;
};

export const MODULE_LIST: { key: keyof Modules; label: string; description: string }[] = [
  { key: "modules_repairs",   label: "Soporte técnico",  description: "Gestión de reparaciones y presupuestos" },
  { key: "modules_budgets",   label: "Presupuestos",     description: "Módulo de presupuestos independiente" },
  { key: "modules_shipping",  label: "Envíos",           description: "Cálculo y gestión de envíos" },
  { key: "modules_coupons",   label: "Cupones",          description: "Descuentos con código de cupón" },
  { key: "modules_analytics", label: "Analíticas",       description: "Reportes y métricas de la tienda" },
];

export function ModulesCard({
  modules,
  action,
}: {
  modules: Modules;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Módulos activos</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
        Activá o desactivá funcionalidades para este cliente. Los cambios se aplican de inmediato en su tienda.
      </p>

      <form action={action}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {MODULE_LIST.map(({ key, label, description }) => (
            <label
              key={key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{description}</p>
              </div>
              <input
                type="checkbox"
                name={key}
                defaultChecked={modules[key]}
                style={{ width: 18, height: 18, accentColor: "#2563eb", cursor: "pointer", flexShrink: 0 }}
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          style={{
            background: "#2563eb", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 24px", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Guardar módulos
        </button>
      </form>
    </div>
  );
}
