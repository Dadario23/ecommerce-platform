import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/roles";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";
import CatalogoClient from "./CatalogoClient";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) redirect("/");

  const { RepairCatalog } = await getModels();
  const items = await RepairCatalog.find()
    .sort({ deviceType: 1, brand: 1, model: 1 })
    .lean();

  const serialized = items.map((i: any) => ({
    _id: String(i._id),
    deviceType: i.deviceType,
    brand: i.brand,
    model: i.model,
    active: i.active,
    repairs: i.repairs ?? [],
  }));

  return <CatalogoClient items={serialized} />;
}
