import type { SearchFilterValues } from "@/features/search/components/SearchFilters";
import type { Product } from "@/lib/products/types";

export function sortSearchResultItems(
  items: Product[],
  sort: SearchFilterValues["sort"],
  referenceCity?: string,
): Product[] {
  if (sort === "most_viewed") {
    return [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }

  if (sort === "nearest" && referenceCity?.trim()) {
    const city = referenceCity.trim().toLowerCase();
    return [...items].sort((a, b) => {
      const aMatch = a.location?.trim().toLowerCase() === city ? 0 : 1;
      const bMatch = b.location?.trim().toLowerCase() === city ? 0 : 1;
      return aMatch - bMatch || (b.views ?? 0) - (a.views ?? 0);
    });
  }

  return items;
}
