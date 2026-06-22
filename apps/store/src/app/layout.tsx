import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/SessionProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/providers/CartProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import { ToastProvider } from "@/hooks/use-toast";
import { getPublicCategories } from "@/lib/getPublicCategories";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientConfig } from "@/config/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getClientConfig();
  return {
    title: storeName,
    description: `${storeName} — Tu tienda de confianza`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, session, clientConfig] = await Promise.all([
    getPublicCategories(),
    getServerSession(authOptions),
    getClientConfig(),
  ]);

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider session={session}>
          <ToastProvider>
            <CartProvider>
              <CartDrawer />
              <LayoutWrapper categories={categories} showRepairs={clientConfig.modules.repairs}>{children}</LayoutWrapper>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
