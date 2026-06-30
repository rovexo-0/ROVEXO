import type { Product } from "@/lib/products/types";

export type SavedSort = "newest" | "price-asc" | "price-desc" | "recently-viewed";

export type SavedEntry = {
  productSlug: string;
  savedAt: string;
  lastViewedAt: string;
};

export type SavedItem = SavedEntry & {
  product: Product;
  categorySlug: string;
};
