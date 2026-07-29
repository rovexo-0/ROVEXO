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

  it("hides the All categories selector on Search Results (UI cleanup v1.0)", () => {
    const results = readSource("features/search/components/SearchResultsView.tsx");
    const filters = readSource("features/search/utils/filters.ts");

    expect(results).not.toContain("All categories");
    expect(results).not.toContain('aria-label="Search filters"');
    expect(results).not.toContain("HOME_CATEGORY_NAV");
    expect(results).not.toContain("handleCategoryChange");
    expect(results).not.toContain("srch-results__filters");
    // Internal category filter param remains for URL / API browsing
    expect(results).toContain("fetchResults(query, category");
    expect(filters).toContain("category?: string");
    expect(filters).not.toContain("condition?:");
    expect(filters).not.toContain("price?:");
  });

  it("keeps homepage header search-only", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const nav = readSource("lib/homepage/canonical-nav.ts");
    const messagesMenu = readSource("lib/account-center/messages-menu.ts");

    expect(header).not.toContain('href="/messages"');
    expect(header).not.toContain("MessageCircle");
    expect(header).not.toContain('href="/inbox?tab=notifications"');
    expect(header).toContain("HomepageSearchField");
    expect(nav).toContain('label: "Inbox"');
    expect(nav).toContain('href: "/inbox"');
    expect(messagesMenu).toContain('title: "Messages"');
    expect(messagesMenu).toContain("INBOX_ROUTES.messagesTab");
    expect(messagesMenu).toContain("INBOX_ROUTES.hub");
  });
});
