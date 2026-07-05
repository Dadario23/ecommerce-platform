"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { PublicCategory } from "@/lib/getPublicCategories";
import type { TenantTheme } from "@/config/tenant-themes";

export default function LayoutWrapper({
  children,
  categories,
  showRepairs,
  storeName,
  logo,
  promoItems,
}: {
  children: React.ReactNode;
  categories: PublicCategory[];
  showRepairs: boolean;
  storeName: string;
  logo: TenantTheme["logo"];
  promoItems: TenantTheme["promoItems"];
}) {
  const pathname = usePathname();

  const hideNavbar =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/soporte-tecnico");

  return (
    <>
      {!hideNavbar && (
        <Navbar
          initialCategories={categories}
          showRepairs={showRepairs}
          storeName={storeName}
          logo={logo}
          promoItems={promoItems}
        />
      )}
      {children}
    </>
  );
}
