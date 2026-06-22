import { getModels } from "@/lib/tenant-models";

export interface PublicCategory {
  _id: string;
  name: string;
  slug?: string;
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  try {
    const { Category } = await getModels();
    const categories = await Category.find(
      { status: "published" },
      "name slug",
    ).sort({ name: 1 }).lean();
    return categories.map((c: any) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
    }));
  } catch {
    return [];
  }
}
