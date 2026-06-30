import { getProductsBySection } from "@/lib/products/repository";

function toSearchTerm(title: string, brand?: string | null): string | null {
  const candidate = brand?.trim() || title.trim().split(/\s+/).slice(0, 3).join(" ");
  if (!candidate || candidate.length < 2) return null;
  return candidate;
}

export async function getPopularSearches(limit = 8): Promise<string[]> {
  const { items } = await getProductsBySection("popular", 1);
  const terms = new Set<string>();

  for (const product of items) {
    const term = toSearchTerm(product.title, product.brand);
    if (term) terms.add(term);
    if (terms.size >= limit) break;
  }

  return [...terms];
}
