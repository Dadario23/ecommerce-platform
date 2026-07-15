import { getClientConfig } from "@/config/client";
import AdminShell from "@/components/admin/AdminShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { modules, theme, storeName } = await getClientConfig();
  return (
    <AdminShell repairsEnabled={modules.repairs} logo={theme.logo} storeName={storeName}>
      {children}
    </AdminShell>
  );
}
