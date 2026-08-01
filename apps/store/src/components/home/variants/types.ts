export type HomeCategory = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  bannerImage?: string;
};

export type HomeReelItem = {
  productSlug: string;
  productName: string;
  url: string;
  thumbnailUrl?: string;
};

export type HomeData = {
  categories: HomeCategory[];
  categoriesWithImages: HomeCategory[];
  carouselImages: string[];
  homeFeaturedMode: "products" | "categories";
  reels: HomeReelItem[];
};
