import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { type ICoupon } from "@/models/Coupon";
import CouponsClient from "./CouponsClient";

export const revalidate = 0;

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Coupon } = await getModels();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean<ICoupon[]>();

  const serialized = coupons.map((c) => ({
    id: String(c._id),
    code: c.code,
    type: c.type,
    value: c.value,
    minOrder: c.minOrder ?? 0,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString(),
    isActive: c.isActive,
  }));

  return <CouponsClient initialCoupons={serialized} />;
}
