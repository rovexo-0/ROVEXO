import type { SavedFilterId } from "@/lib/saved/categories";
import type { SavedItem, SavedSort } from "@/lib/saved/types";

export function filterSavedItems(
  items: SavedItem[],
  filter: SavedFilterId,
  query: string,
): SavedItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    if (filter !== "all" && filter !== "more" && item.categorySlug !== filter) {
      return false;
    }

    if (!normalizedQuery) return true;

    return (
      item.product.title.toLowerCase().includes(normalizedQuery) ||
      item.product.sellerName.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function sortSavedItems(items: SavedItem[], sort: SavedSort): SavedItem[] {
  const sorted = [...items];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.product.price - b.product.price);
    case "price-desc":
      return sorted.sort((a, b) => b.product.price - a.product.price);
    case "recently-viewed":
      return sorted.sort(
        (a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime(),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      );
  }
}

export const SAVED_SORT_OPTIONS: Array<{ id: SavedSort; label: string }> = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price Low-High" },
  { id: "price-desc", label: "Price High-Low" },
  { id: "recently-viewed", label: "Recently Viewed" },
];
