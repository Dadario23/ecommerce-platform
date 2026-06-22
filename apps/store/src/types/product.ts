// src/types/product.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  description: string;

  images: string[]; // ✅ único campo de imágenes

  category: { _id: string; name: string } | string;
  brand?: string;
  stock?: number;

  isActive?: boolean;
  rating?: number;

  createdAt?: string;
}

// src/types/sort.ts
export interface SortConfig {
  key: keyof Product;
  direction: "asc" | "desc";
}
