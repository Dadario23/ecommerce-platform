import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { isAdmin } from "@/lib/roles";
import EquipoClient from "./EquipoClient";

export const revalidate = 0;

export default async function EquipoPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) redirect("/");

  const { User } = await getModels();
  const users = await User.find(
    {},
    { name: 1, email: 1, role: 1, createdAt: 1 },
  ).sort({ role: 1, name: 1 }).lean();

  const serialized = users.map((u: any) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role as string,
    createdAt: u.createdAt.toISOString(),
  }));

  return <EquipoClient users={serialized} />;
}
