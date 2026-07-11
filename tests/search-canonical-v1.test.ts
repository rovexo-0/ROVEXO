import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Search canonical v1.0 final UI lock", () => {
  it("removes auctions, businesses, and location filters from search surfaces", () => {
    const overlay = readSource("features/search/components/SearchOverlay.tsx");
    const results = readSource("features/search/components/SearchResultsView.tsx");
    const filters = readSource("features/search/utils/filters.ts");

    expect(overlay).not.toContain("SearchScopeChips");
    expect(overlay).not.toContain("SearchLocationFilter");
    expect(results).not.toContain("SearchScopeChips");
    expect(results).not.toContain('from "@/features/search/components/SearchFilters"');
    expect(filters).not.toContain("auctions");
    expect(filters).not.toContain("businesses");
    expect(filters).not.toContain("location");
  });

  it("implements close search with homepage scroll restore", () => {
    const results = readSource("features/search/components/SearchResultsView.tsx");
    const restore = readSource("lib/navigation/homepage-scroll-restore.ts");
    const rail = readSource("components/homepage/canonical/CanonicalCategoryRail.tsx");

    expect(results).toContain("srch-results__close");
    expect(results).toContain("closeSearchAndReturnHome");
    expect(restore).toContain("captureHomepageScroll");
    expect(restore).toContain("restoreHomepageScroll");
    expect(rail).toContain("captureHomepageScroll");
  });

  it("removes messages from header and account menu duplicates", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(header).not.toContain('href="/messages"');
    expect(header).not.toContain("MessageSquare");
    expect(header).toContain('href="/notifications"');
    expect(menu).not.toContain('title: "Messages"');
    expect(menu).not.toContain('href: "/messages"');
  });
});
