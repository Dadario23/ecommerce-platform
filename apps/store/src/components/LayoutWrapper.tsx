"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { PublicCategory } from "@/lib/getPublicCategories";
import type { TenantTheme } from "@/config/tenant-themes";
import type { ClientConfig } from "@/config/client";

export default function LayoutWrapper({
  children,
  categories,
  showRepairs,
  storeName,
  logo,
  navStyle,
  promoItems,
  contact,
}: {
  children: React.ReactNode;
  categories: PublicCategory[];
  showRepairs: boolean;
  storeName: string;
  logo: TenantTheme["logo"];
  navStyle: TenantTheme["navStyle"];
  promoItems: TenantTheme["promoItems"];
  contact: ClientConfig["contact"];
}) {
  const pathname = usePathname();

  const hideNavbar =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/soporte-tecnico/admin");

  return (
    <>
      {!hideNavbar && (
        <Navbar
          initialCategories={categories}
          showRepairs={showRepairs}
          storeName={storeName}
          logo={logo}
          navStyle={navStyle}
          promoItems={promoItems}
        />
      )}
      {children}
      {!hideNavbar && (
        <Footer
          categories={categories}
          storeName={storeName}
          logo={logo}
          showRepairs={showRepairs}
          contact={contact}
        />
      )}
    </>
  );
}
