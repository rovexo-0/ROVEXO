import type { Product } from "@/lib/products/types";
import type { Database } from "@/lib/supabase/types/database";

export type SavedSort = "newest" | "price-asc" | "price-desc" | "recently-viewed";

export type SavedProductStatus = Database["public"]["Enums"]["product_status"];

export type SavedEntry = {
  productSlug: string;
  savedAt: string;
  lastViewedAt: string;
};

export type SavedItem = SavedEntry & {
  product: Product;
  categorySlug: string;
  listingStatus?: SavedProductStatus;
};
