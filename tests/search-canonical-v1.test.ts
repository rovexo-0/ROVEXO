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

  it("shows the real category filter without expanding the search contract", () => {
    const results = readSource("features/search/components/SearchResultsView.tsx");
    const filters = readSource("features/search/utils/filters.ts");

    expect(results).toContain('aria-label="Search filters"');
    expect(results).toContain("<select");
    expect(results).toContain("All categories");
    expect(results).toContain("HOME_CATEGORY_NAV");
    expect(filters).toContain("category?: string");
    expect(filters).not.toContain("condition?:");
    expect(filters).not.toContain("price?:");
  });

  it("routes homepage communication through the singular Inbox hub", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const nav = readSource("lib/homepage/canonical-nav.ts");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(header).not.toContain('href="/messages"');
    expect(header).not.toContain("MessageCircle");
    expect(header).toContain('href="/notifications"');
    expect(nav).toContain('label: "Inbox"');
    expect(nav).toContain('href: "/inbox"');
    // Absolute Final: account Messages routes to Transaction Hub at /messages.
    expect(menu).toContain('title: "Messages"');
    expect(menu).toContain('href: "/inbox"');
  });
});
