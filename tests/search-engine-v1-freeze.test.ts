import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SEARCH_ENGINE_V1 } from "@/lib/search/search-engine-v1";
import { rankSearchProducts, scoreProductMatch } from "@/lib/search/rank-products";
import { clearSearchCache, getSearchCache, setSearchCache, withSearchCache } from "@/lib/search/cache";
import type { Product } from "@/lib/products/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function product(partial: Partial<Product> & Pick<Product, "id" | "title">): Product {
  return {
    slug: partial.slug ?? partial.id,
    price: partial.price ?? 10,
    condition: partial.condition ?? "Good",
    sellerName: partial.sellerName ?? "Seller",
    rating: partial.rating ?? 0,
    reviewCount: partial.reviewCount ?? 0,
    imageUrl: partial.imageUrl ?? "/placeholder-product.svg",
    sections: partial.sections ?? ["new"],
    ...partial,
  };
}

describe("Search Engine v1.0 Senior Architect Freeze", () => {
  beforeEach(() => {
    clearSearchCache();
  });

  it("locks one engine, zero admin, and forbidden parallel systems", () => {
    expect(SEARCH_ENGINE_V1.version).toBe("1.0");
    expect(SEARCH_ENGINE_V1.zeroAdminPolicy).toBe(true);
    expect(SEARCH_ENGINE_V1.zeroQuestionsPolicy).toBe(true);
    expect(SEARCH_ENGINE_V1.userMustOnlyWrite).toBe(true);
    expect(SEARCH_ENGINE_V1.filtersAfterSearchOnly).toBe(true);
    expect(SEARCH_ENGINE_V1.status).toBe("ABSOLUTE_MASTER_FREEZE");
    expect(SEARCH_ENGINE_V1.productionDeploy).toBe("FORBIDDEN_UNTIL_100_CERTIFIED");
    expect(SEARCH_ENGINE_V1.idleSections).toEqual(["Recent Searches", "Trending Searches"]);
    expect(SEARCH_ENGINE_V1.idleForbidden).toContain("Categories");
    expect(SEARCH_ENGINE_V1.channels).toEqual(["text", "camera", "filters"]);
    expect(SEARCH_ENGINE_V1.forbidden).toContain("AI Search");
    expect(SEARCH_ENGINE_V1.forbidden).toContain("Filters before search");
    expect(SEARCH_ENGINE_V1.resultPriority[0]).toBe("exact");
  });

  it("ranks exact title above partial and never randomizes ties", () => {
    const items = [
      product({ id: "1", title: "Blue Nike Runner", brand: "Nike", views: 10 }),
      product({ id: "2", title: "Nike", brand: "Nike", views: 1 }),
      product({ id: "3", title: "Red Shoes", brand: "Adidas", views: 999 }),
    ];
    const ranked = rankSearchProducts(items, "Nike");
    expect(ranked[0]?.id).toBe("2");
    expect(scoreProductMatch(items[1]!, "Nike")).toBeGreaterThan(
      scoreProductMatch(items[2]!, "Nike"),
    );
  });

  it("caches hot buckets and falls back when loader fails", async () => {
    setSearchCache("popular", "limit:3", ["A", "B"]);
    expect(getSearchCache<string[]>("popular", "limit:3")).toEqual(["A", "B"]);

    const failed = await withSearchCache(
      "trending",
      "boom",
      async () => {
        throw new Error("db down");
      },
      { emptyOnError: ["fallback"] },
    );
    expect(failed).toEqual(["fallback"]);
  });

  it("wires ranking + image pipeline into the singular search path", () => {
    const server = readSource("features/search/utils/search-server.ts");
    const actions = readSource("features/search/components/SearchInputActions.tsx");
    const imageView = readSource("features/search/components/ImageSearchView.tsx");
    const popular = readSource("lib/search/popular-searches.ts");
    const adminEngine = readSource("lib/search-engine/engine.ts");

    expect(server).toContain("rankSearchProducts");
    expect(actions).toContain("prepareSearchImage");
    expect(actions).toContain("Confirm photo");
    expect(actions).not.toContain("onVoice");
    expect(imageView).toContain("Recommended products");
    expect(imageView).toContain("CAMERA_SEARCH_V1");
    expect(imageView).not.toContain("No similar listings found");
    expect(popular).toContain("withSearchCache");
    expect(readSource("lib/search/trending.ts")).toContain("withSearchCache");
    // Admin ops module must not be imported by marketplace search server.
    expect(server).not.toContain("@/lib/search-engine");
    expect(adminEngine).toContain("updatePlatformSetting");

    const resultsView = readSource("features/search/components/SearchResultsView.tsx");
    expect(resultsView).toContain("{query ? (");
    expect(resultsView).toContain('aria-label="Search filters"');
  });
});
