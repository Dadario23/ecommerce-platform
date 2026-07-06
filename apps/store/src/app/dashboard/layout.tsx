import { getClientConfig } from "@/config/client";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { modules, theme, storeName } = await getClientConfig();
  return (
    <DashboardShell repairsEnabled={modules.repairs} logo={theme.logo} storeName={storeName}>
      {children}
    </DashboardShell>
  );
}
