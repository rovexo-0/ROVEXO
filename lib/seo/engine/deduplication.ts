import type { Product } from "@/lib/products/types";

export type DuplicateCluster = {
  canonicalSlug: string;
  duplicateSlugs: string[];
  reason: "title" | "image" | "description";
  similarity: number;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" "));
  const wordsB = new Set(normalizeText(b).split(" "));
  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Detect near-duplicate listings within a result set for canonicalization hints. */
export function detectDuplicateClusters(products: Product[], threshold = 0.85): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const consumed = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const a = products[i]!;
    if (consumed.has(a.slug)) continue;

    const duplicates: string[] = [];
    for (let j = i + 1; j < products.length; j++) {
      const b = products[j]!;
      if (consumed.has(b.slug)) continue;

      const titleSim = titleSimilarity(a.title, b.title);
      const sameImage = a.imageUrl && b.imageUrl && a.imageUrl === b.imageUrl;
      const descSim =
        a.description && b.description
          ? titleSimilarity(a.description.slice(0, 200), b.description.slice(0, 200))
          : 0;

      if (titleSim >= threshold || sameImage || descSim >= threshold) {
        duplicates.push(b.slug);
        consumed.add(b.slug);
      }
    }

    if (duplicates.length) {
      clusters.push({
        canonicalSlug: a.slug,
        duplicateSlugs: duplicates,
        reason: duplicates.length && a.imageUrl === products.find((p) => p.slug === duplicates[0])?.imageUrl ? "image" : "title",
        similarity: threshold,
      });
      consumed.add(a.slug);
    }
  }

  return clusters;
}

export function deduplicateProductList(products: Product[]): Product[] {
  const clusters = detectDuplicateClusters(products);
  const suppressed = new Set(clusters.flatMap((cluster) => cluster.duplicateSlugs));
  return products.filter((product) => !suppressed.has(product.slug));
}
