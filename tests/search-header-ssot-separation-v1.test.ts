import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Search Header SSOT separation v1.0", () => {
  it("Header Search opens Global Search /search — never Browse Categories landing", () => {
    const field = readSource("components/home/HomepageSearchField.tsx");
    const searchPage = readSource("app/(platform)/search/page.tsx");
    const results = readSource("features/search/components/SearchResultsView.tsx");
    const landing = readSource("features/search/components/SearchLandingView.tsx");

    expect(field).toContain('router.push("/search")');
    expect(field).not.toContain('router.push("/browse")');
    expect(searchPage).not.toContain("getCanonicalBrowseCategoryCounts");
    expect(results).toContain('surface="search"');
    expect(landing).toContain('surface?: "browse" | "search"');
    expect(landing).toContain("isGlobalSearch");
  });

  it("Bottom Browse opens /browse Browse Categories — independent of Header Search", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    const canonical = readSource("lib/homepage/canonical-nav.ts");
    const browsePage = readSource("app/(platform)/browse/page.tsx");

    expect(nav).toContain('href: "/browse"');
    expect(nav).toContain('t("nav.browse")');
    expect(canonical).toContain('href: "/browse"');
    expect(browsePage).toContain('surface="browse"');
    expect(browsePage).toContain("getCanonicalBrowseCategoryCounts");
    expect(browsePage).toContain("SearchLandingView");
  });

  it("keeps Camera Search on Global Search path", () => {
    const searchPage = readSource("app/(platform)/search/page.tsx");
    expect(searchPage).toContain("CAMERA_SEARCH_V1");
    expect(searchPage).toContain("visual === \"1\"");
  });
});
