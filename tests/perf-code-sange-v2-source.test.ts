import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("PERFORMANCE CODE SÂNGE v2.0 — source locks", () => {
  it("derives popular search terms from a slim public query, not full product cards", () => {
    const popular = readSource("lib/search/popular-searches.ts");
    expect(popular).toContain("withSearchCache");
    expect(popular).toContain("title, seller_id, brands ( name )");
    expect(popular).toContain("createPublicCatalogueClient");
    expect(popular).toContain("applyHolidayModeVisibilityFilter");
    expect(popular).not.toContain("getProductsBySection");
    expect(popular).not.toContain("PRODUCT_SELECT");
    expect(popular).not.toContain("enrichMarketplaceListingProducts");
  });

  it("dedupes store profile resolve across metadata + page and parallelizes independent store work", () => {
    const userPage = readSource("app/(platform)/user/[username]/page.tsx");
    expect(userPage).toContain("resolvePublicProfileCached");
    expect(userPage).toContain("authPromise");
    expect(userPage).toContain("getFollowCounts");
    expect(userPage).toContain("getPublicBadges");

    const follow = readSource("lib/follow/marketplace-follow-store-v1.ts");
    expect(follow).toMatch(/export const getFollowCounts = cache\(/);

    const storeRepo = readSource("lib/store/store-repository.ts");
    expect(storeRepo).toMatch(/export const resolveStoreByRouteParam = cache\(/);

    const storeVisit = readSource("lib/store/load-store-visit-payload.ts");
    expect(storeVisit).toContain("authPromise");
    expect(storeVisit).toContain("listSellerReviews");
    expect(storeVisit).toContain("getFollowCounts");
  });
});
