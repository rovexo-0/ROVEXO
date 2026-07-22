import { homeCategories } from "@/lib/categories";

export type SearchScope = "products" | "users" | "stores";

export type SuggestedSeller = {
  name: string;
  href: string;
  avatar?: string | null;
};

export const defaultRecentSearches = [
  "Nike Air Max",
  "Vintage camera",
  "Standing desk",
];

export const defaultTrendingSearches = [
  "Cars",
  "iPhone",
  "Furniture",
  "Tools",
  "Fashion",
  "Pets",
];

export const defaultCategories = homeCategories.map((category) => ({
  name: category.name,
  href: `/category/${category.slug}`,
}));

export const defaultSuggestedSellers: SuggestedSeller[] = [];

export const searchScopes: { id: SearchScope; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "users", label: "Users" },
  { id: "stores", label: "Stores" },
];

export function filterSuggestions(items: string[], query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => item.toLowerCase().includes(normalized));
}

export function filterSellers(sellers: SuggestedSeller[], query: string): SuggestedSeller[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sellers;

  return sellers.filter((seller) => seller.name.toLowerCase().includes(normalized));
}
