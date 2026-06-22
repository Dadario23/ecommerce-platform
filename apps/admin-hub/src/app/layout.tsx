import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Hub — Panel de Gestión",
  description: "Panel central de administración de clientes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        {children}
      </body>
    </html>
  );
}
