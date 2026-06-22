import { notFound } from "next/navigation";
import { getClientConfig } from "@/config/client";

export default async function SoporteTecnicoLayout({ children }: { children: React.ReactNode }) {
  const { modules } = await getClientConfig();
  if (!modules.repairs) notFound();
  return <>{children}</>;
}
