import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOBAL_EMPTY_STATE_SEARCH_BROWSE_LOCK } from "@/lib/search/global-empty-state-search-browse-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Owner UI Lock — Global Empty State (Search & Browse)", () => {
  it("locks canonical copy and keep/remove contract", () => {
    expect(GLOBAL_EMPTY_STATE_SEARCH_BROWSE_LOCK.title).toBe("No products found");
    expect(GLOBAL_EMPTY_STATE_SEARCH_BROWSE_LOCK.keep).toContain("Search bar");
    expect(GLOBAL_EMPTY_STATE_SEARCH_BROWSE_LOCK.remove).toContain("Browse Categories button");
  });

  it("MarketplaceNoProductsEmpty is minimal", () => {
    const source = readSource("features/search/components/MarketplaceNoProductsEmpty.tsx");
    expect(source).toContain("No products found");
    expect(source).not.toContain("Browse categories");
    expect(source).not.toContain("actionHref");
    expect(source).not.toContain("actionLabel");
    expect(source).not.toContain("suggestions");
  });

  it("SearchResultsEmpty no longer ships recovery or browse CTA", () => {
    const source = readSource("features/search/components/SearchResultsEmpty.tsx");
    expect(source).toContain("MarketplaceNoProductsEmpty");
    expect(source).not.toContain("Browse categories");
    expect(source).not.toContain("zero-results");
    expect(source).not.toContain("You might also like");
  });

  it("Search results empty chrome hides filters and helpers", () => {
    const source = readSource("features/search/components/SearchResultsView.tsx");
    expect(source).toContain("srch-results--empty");
    expect(source).toContain("MarketplaceNoProductsEmpty");
    expect(source).toContain("srch-results__empty-bar");
    const emptyReturnStart = source.indexOf("if (showCanonicalEmpty)");
    const emptyReturnEnd = source.indexOf("return (\n    <div className=\"srch-results\"", emptyReturnStart);
    const emptyBranch = source.slice(emptyReturnStart, emptyReturnEnd > 0 ? emptyReturnEnd : undefined);
    expect(emptyBranch).toContain("MarketplaceNoProductsEmpty");
    expect(emptyBranch).not.toContain("All categories");
    expect(emptyBranch).not.toContain("srch-results__count");
    expect(emptyBranch).not.toContain("Browse categories");
  });
});
