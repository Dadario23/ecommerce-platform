import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { getTenantTheme } from "@/config/tenant-themes";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? process.env.TENANT_SLUG ?? "store";
  const showFeaturedModeToggle = getTenantTheme(slug).homeVariant === "tech";

  const { Setting } = await getModels();
  let doc = await Setting.findOne().lean<{
    storeEmail: string;
    storeDescription: string; instagramUrl: string;
    facebookUrl: string; whatsappNumber: string;
    homeFeaturedMode?: "products" | "categories";
  }>();
  if (!doc) {
    const created = await Setting.create({});
    doc = await Setting.findById(created._id).lean() as typeof doc;
  }

  const settings = {
    storeEmail:            doc?.storeEmail ?? "",
    storeDescription:      doc?.storeDescription ?? "",
    instagramUrl:          doc?.instagramUrl ?? "",
    facebookUrl:           doc?.facebookUrl ?? "",
    whatsappNumber:        doc?.whatsappNumber ?? "",
    homeFeaturedMode:      doc?.homeFeaturedMode ?? "products",
  };

  return (
    <SettingsClient
      initialSettings={settings}
      adminName={session.user?.name ?? ""}
      adminEmail={session.user?.email ?? ""}
      showFeaturedModeToggle={showFeaturedModeToggle}
    />
  );
}
