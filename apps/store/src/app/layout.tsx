import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Playfair_Display, Anton } from "next/font/google";
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
import type { FontKey } from "@/config/tenant-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  preload: false,
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const FONT_VARS: Record<FontKey, { sans: string; display: string }> = {
  geist: { sans: "var(--font-geist-sans)", display: "var(--font-geist-sans)" },
  manrope: { sans: "var(--font-manrope)", display: "var(--font-manrope)" },
  editorial: { sans: "var(--font-geist-sans)", display: "var(--font-playfair)" },
  urban: { sans: "var(--font-geist-sans)", display: "var(--font-anton)" },
};

export async function generateMetadata(): Promise<Metadata> {
  const { storeName, theme } = await getClientConfig();
  return {
    title: storeName,
    description: `${storeName} — Tu tienda de confianza`,
    icons: { icon: theme.favicon ?? "/favicon.ico" },
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

  const { theme } = clientConfig;
  const fonts = FONT_VARS[theme.font];

  return (
    <html
      lang="es"
      data-store-name={clientConfig.storeName}
      data-whatsapp={clientConfig.contact.whatsapp}
      data-module-repairs={clientConfig.modules.repairs ? "1" : "0"}
      data-card-style={theme.cardStyle}
      style={{
        "--tenant-primary": theme.colors.primary,
        "--tenant-primary-hover": theme.colors.primaryHover,
        "--tenant-on-primary": theme.colors.onPrimary,
        "--tenant-tint": theme.colors.tint,
        "--tenant-accent": theme.colors.accent,
        "--tenant-font-sans": fonts.sans,
        "--tenant-font-display": fonts.display,
        "--radius": theme.radius,
        ...(theme.colors.background && { "--background": theme.colors.background }),
        ...(theme.backgroundPattern && { "--background-pattern": `url(${theme.backgroundPattern})` }),
      } as React.CSSProperties}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${playfair.variable} ${anton.variable} antialiased`}
      >
        <AuthProvider session={session}>
          <ToastProvider>
            <CartProvider>
              <CartDrawer />
              <LayoutWrapper
                categories={categories}
                showRepairs={clientConfig.modules.repairs}
                storeName={clientConfig.storeName}
                logo={theme.logo}
                navStyle={theme.navStyle}
                promoItems={theme.promoItems}
                contact={clientConfig.contact}
              >
                {children}
              </LayoutWrapper>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
