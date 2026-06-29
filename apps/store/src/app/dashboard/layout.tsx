import { getClientConfig } from "@/config/client";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { modules } = await getClientConfig();
  return <DashboardShell repairsEnabled={modules.repairs}>{children}</DashboardShell>;
}
