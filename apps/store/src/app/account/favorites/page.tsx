import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import FavoritesClient from "./FavoritesClient";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { User, Product } = await getModels();

  const user = await User.findOne({ email: session.user.email })
    .select("favorites")
    .lean<{ favorites: string[] }>();

  const favoriteIds = user?.favorites ?? [];

  const products = favoriteIds.length > 0
    ? await Product.find({ _id: { $in: favoriteIds }, isActive: true })
        .select("_id slug name price compareAtPrice images brand stock condition shippingTypes freeShipping")
        .lean()
    : [];

  const serialized = products.map((p) => ({
    _id: String(p._id),
    slug: p.slug as string,
    name: p.name as string,
    price: p.price as number,
    compareAtPrice: p.compareAtPrice as number | undefined,
    images: p.images as string[],
    brand: p.brand as string | undefined,
    stock: p.stock as number | undefined,
    condition: p.condition as "new" | "used" | undefined,
    shippingTypes: p.shippingTypes as string[] | undefined,
    freeShipping: p.freeShipping as boolean | undefined,
  }));

  return <FavoritesClient products={serialized} />;
}
