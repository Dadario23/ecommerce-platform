import type { Metadata } from "next";
import { CLIENT_CONFIG } from "@/config/client";

export const metadata: Metadata = {
  title: CLIENT_CONFIG.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
