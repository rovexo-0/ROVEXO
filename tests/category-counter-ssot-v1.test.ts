import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveEligibleVisibleTotal } from "@/lib/listings/resolve-eligible-visible-total";
import { buildCategoryEligibleListingsOptions } from "@/lib/listings/eligible-listings";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Category counter SSOT certification v1.0", () => {
  it("Browse Categories uses eligible listings counts — not raw published tallies", () => {
    // Browse Categories ownership = `/browse` (Bottom Nav). Header Search `/search` must not load counters.
    const browsePage = readSource("app/(platform)/browse/page.tsx");
    const searchPage = readSource("app/(platform)/search/page.tsx");
    expect(browsePage).toContain("getCanonicalBrowseCategoryCounts");
    expect(browsePage).not.toContain("getTopLevelCategoryCounts");
    expect(browsePage).not.toContain("aggregateCountsByCanonicalRoot");
    expect(searchPage).not.toContain("getCanonicalBrowseCategoryCounts");
    expect(searchPage).not.toContain("getTopLevelCategoryCounts");
    expect(searchPage).not.toContain("aggregateCountsByCanonicalRoot");
  });

  it("Category page and Browse counters share buildCategoryEligibleListingsOptions", () => {
    const categoryPage = readSource("app/(platform)/category/[...slug]/page.tsx");
    const eligible = readSource("lib/listings/eligible-listings.ts");
    expect(categoryPage).toContain("buildCategoryEligibleListingsOptions");
    expect(categoryPage).toContain("getEligibleListings");
    expect(eligible).toContain("getCanonicalBrowseCategoryCounts");
    expect(eligible).toContain("countEligibleListings");
    expect(eligible).toContain("buildCategoryEligibleListingsOptions");
  });

  it("SSOT owner remains getEligibleListings / searchListings", () => {
    const eligible = readSource("lib/listings/eligible-listings.ts");
    expect(eligible).toContain("await searchListings(searchOptions)");
    expect(eligible).toContain("countEligibleListings");
    expect(eligible).toContain("getEligibleListings");
  });

  it("empty category → visible total 0", () => {
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 0,
        rawRowCount: 0,
        eligibleItemCount: 0,
      }),
    ).toBe(0);
  });

  it("1 listing → counter == grid (1)", () => {
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 1,
        rawRowCount: 1,
        eligibleItemCount: 1,
      }),
    ).toBe(1);
  });

  it("multiple listings → counter == grid", () => {
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 7,
        rawRowCount: 7,
        eligibleItemCount: 7,
      }),
    ).toBe(7);
  });

  it("holiday / hidden / draft-style ineligible rows drop from visible total", () => {
    // 12 published in category, only 1 passes Holiday + HomepageEligibility
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 12,
        rawRowCount: 12,
        eligibleItemCount: 1,
      }),
    ).toBe(1);
  });

  it("archived / deleted / pending never inflate when filtered to zero", () => {
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 5,
        rawRowCount: 5,
        eligibleItemCount: 0,
      }),
    ).toBe(0);
  });

  it("mixed categories: pagination partial page keeps db total until full recount", () => {
    expect(
      resolveEligibleVisibleTotal({
        page: 1,
        pageSize: 24,
        dbTotal: 100,
        rawRowCount: 24,
        eligibleItemCount: 20,
      }),
    ).toBe(100);
  });

  it("parent/child mapping uses categoryIds when present (same as Listing Grid)", () => {
    const withIds = buildCategoryEligibleListingsOptions({
      slugPath: ["electronics"],
      categoryIds: ["root", "phones", "laptops"],
    });
    expect(withIds.surface).toBe("category");
    expect(withIds.categoryIds).toEqual(["root", "phones", "laptops"]);
    expect(withIds.categorySlugPath).toBeUndefined();

    const slugOnly = buildCategoryEligibleListingsOptions({
      slugPath: ["electronics"],
      categoryIds: [],
    });
    expect(slugOnly.categoryIds).toBeUndefined();
    expect(slugOnly.categorySlugPath).toEqual(["electronics"]);
  });

  it("does not redesign Browse Categories UI / SearchCategoryBrowseCard", () => {
    const card = readSource("features/search/components/SearchCategoryBrowseCard.tsx");
    expect(card).toContain("itemCount");
    expect(card).toContain("formatItemCount");
    const landing = readSource("features/search/components/SearchLandingView.tsx");
    expect(landing).toContain("Browse categories");
    expect(landing).toContain("itemCount={countBySlug.get(item.slug) ?? 0}");
  });
});
