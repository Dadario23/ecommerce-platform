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
  }>();
  if (!doc) {
    const created = await Setting.create({});
    doc = await Setting.findById(created._id).lean() as typeof doc;
  }

  const settings = {
    storeName:             doc?.storeName ?? "Compumobile",
    storeEmail:            doc?.storeEmail ?? "",
    storePhone:            doc?.storePhone ?? "",
    storeDescription:      doc?.storeDescription ?? "",
    shippingCost:          doc?.shippingCost ?? 0,
    freeShippingThreshold: doc?.freeShippingThreshold ?? 0,
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
    />
  );
}
