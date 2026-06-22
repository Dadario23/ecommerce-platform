export interface CategoryOption {
  _id: string;
  name: string;
  thumbnail?: string | null;
}

export function normalizeCategories(categories: any[]): CategoryOption[] {
  return categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    thumbnail: cat.thumbnail ?? null,
  }));
}
