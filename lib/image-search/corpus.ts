import type { Product, ProductsPage } from "@/lib/products/types";

const MAX_PAGES = 12;

export async function fetchActiveListingCorpus(signal?: AbortSignal): Promise<Product[]> {
  const items: Product[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(`/api/homepage/feed?page=${page}`, {
      signal,
      cache: "no-store",
    });
    if (!response.ok) break;

    const payload = (await response.json()) as ProductsPage;
    for (const product of payload.items) {
      if (!product.imageUrl || seen.has(product.id)) continue;
      seen.add(product.id);
      items.push(product);
    }

    if (!payload.hasMore) break;
  }

  return items;
}
