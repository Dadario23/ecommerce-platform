export type HomeCategory = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  bannerImage?: string;
};

export type HomeData = {
  categories: HomeCategory[];
  categoriesWithImages: HomeCategory[];
  carouselImages: string[];
  homeFeaturedMode: "products" | "categories";
};
