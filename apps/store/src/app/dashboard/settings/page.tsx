import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Setting } = await getModels();
  let doc = await Setting.findOne().lean<{
    storeName: string; storeEmail: string; storePhone: string;
    storeDescription: string; shippingCost: number;
    freeShippingThreshold: number; instagramUrl: string;
    facebookUrl: string; whatsappNumber: string;
    homeFeaturedMode?: "products" | "categories";
    modules_repairs?: boolean; modules_budgets?: boolean;
    modules_shipping?: boolean; modules_coupons?: boolean;
    modules_analytics?: boolean;
  }>();
  if (!doc) {
    const created = await Setting.create({});
    doc = await Setting.findById(created._id).lean() as typeof doc;
  }

  const settings = {
    storeName:             doc?.storeName ?? "",
    storeEmail:            doc?.storeEmail ?? "",
    storePhone:            doc?.storePhone ?? "",
    storeDescription:      doc?.storeDescription ?? "",
    shippingCost:          doc?.shippingCost ?? 0,
    freeShippingThreshold: doc?.freeShippingThreshold ?? 0,
    instagramUrl:          doc?.instagramUrl ?? "",
    facebookUrl:           doc?.facebookUrl ?? "",
    whatsappNumber:        doc?.whatsappNumber ?? "",
    homeFeaturedMode:      doc?.homeFeaturedMode ?? "products",
    modules_repairs:       doc?.modules_repairs ?? false,
    modules_budgets:       doc?.modules_budgets ?? false,
    modules_shipping:      doc?.modules_shipping ?? true,
    modules_coupons:       doc?.modules_coupons ?? true,
    modules_analytics:     doc?.modules_analytics ?? true,
  };

  return (
    <SettingsClient
      initialSettings={settings}
      adminName={session.user?.name ?? ""}
      adminEmail={session.user?.email ?? ""}
    />
  );
}
