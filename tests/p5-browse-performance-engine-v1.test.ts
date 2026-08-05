import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * P5 — Browse Performance Engine contracts.
 * Render isolation only — no UI / filter / sort / ranking / infinite-scroll invention.
 */
describe("P5 Browse Performance Engine v1", () => {
  it("memoises Browse category tiles", () => {
    const card = readSource("features/search/components/SearchCategoryBrowseCard.tsx");
    expect(card).toContain("memo(function SearchCategoryBrowseCard");
  });

  it("isolates BrowseCategoriesGrid from history hydrate", () => {
    const landing = readSource("features/search/components/SearchLandingView.tsx");
    expect(landing).toContain("BrowseCategoriesGrid");
    expect(landing).toContain("memo(function BrowseCategoriesGrid");
    expect(landing).toContain("EMPTY_CATEGORY_COUNTS");
    expect(landing).toContain("EMPTY_TRENDING");
    expect(landing).toContain("<BrowseCategoriesGrid categoryCounts={categoryCounts} />");
    expect(landing).toContain("TrendingSearchesSection");
    // Defaults must not allocate fresh [] per call
    expect(landing).not.toMatch(/categoryCounts = \[\]/);
    expect(landing).not.toMatch(/trending = \[\]/);
  });

  it("does not invent Browse client infinite scroll / virtualisation", () => {
    const category = readSource("features/categories/components/CategoryPageView.tsx");
    const programmatic = readSource("features/seo/components/ProgrammaticPageView.tsx");
    const browsePage = readSource("app/(platform)/browse/page.tsx");
    const browseSegments = readSource("app/(platform)/browse/[...segments]/page.tsx");

    for (const source of [category, programmatic, browsePage, browseSegments]) {
      expect(source).not.toMatch(/virtua|react-window|react-virtual|useVirtualizer/i);
      expect(source).not.toContain("IntersectionObserver");
      expect(source).not.toContain("loadMore");
    }
  });

  it("keeps Browse listing grids on ListingCard SSOT", () => {
    const category = readSource("features/categories/components/CategoryPageView.tsx");
    const programmatic = readSource("features/seo/components/ProgrammaticPageView.tsx");
    expect(category).toContain("ListingCard");
    expect(category).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(programmatic).toContain("ListingCard");
    expect(programmatic).toContain("HP_CANONICAL_LISTING_PROPS");
  });

  it("scopes live view subscriptions per listing slug", () => {
    const sync = readSource("lib/views/view-live-sync.ts");
    const hook = readSource("lib/views/use-live-product-views.ts");
    expect(sync).toContain("slugListeners");
    expect(sync).toContain("subscribeLiveViewCount");
    expect(hook).toContain("subscribeLiveViewCount");
    expect(hook).not.toContain("subscribeViewLive(");
  });
});
