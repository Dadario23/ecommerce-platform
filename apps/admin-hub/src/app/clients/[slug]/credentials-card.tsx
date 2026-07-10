// Los valores crudos nunca llegan acá: `current` ya viene enmascarado (secrets)
// o formateado desde el server component.
export type CredentialField = {
  key: string;
  label: string;
  current: string;
};

export function CredentialsCard({
  fields,
  action,
}: {
  fields: CredentialField[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "28px 32px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Credenciales</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
        Dejá un campo vacío para conservar el valor actual. Escribí <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>-</code> para
        vaciarlo (vuelve al fallback de las env vars globales).
      </p>

      <form action={action} autoComplete="off">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {fields.map(({ key, label, current }) => (
            <div key={key} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label htmlFor={key} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
                {label}
              </label>
              <input
                id={key}
                type="text"
                name={key}
                defaultValue=""
                autoComplete="off"
                placeholder="(sin cambios)"
                style={{
                  width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1",
                  borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "monospace",
                }}
              />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Actual: <span style={{ fontFamily: "monospace" }}>{current}</span>
              </p>
            </div>
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
          Guardar credenciales
        </button>
      </form>
    </div>
  );
}
