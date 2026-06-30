import { cacheWrap } from "@/lib/cache/memory";
import { listBusinessDirectory } from "@/lib/business/directory";
import { fetchProducts } from "@/lib/products/queries";
import type { Product } from "@/lib/products/types";

export async function getRecommendedListings(limit = 8): Promise<Product[]> {
  return cacheWrap("recommendations:listings", 60_000, async () => {
    const page = await fetchProducts("recommended", 1);
    return page.items.slice(0, limit);
  });
}

export async function getRecommendedBusinesses(limit = 6) {
  return cacheWrap("recommendations:businesses", 120_000, async () => {
    const directory = await listBusinessDirectory(limit * 2);
    return directory.filter((entry) => entry.verifiedBusiness || entry.trustScore >= 55).slice(0, limit);
  });
}
