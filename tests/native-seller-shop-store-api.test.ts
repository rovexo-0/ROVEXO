import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("Native Seller Shop store API", () => {
  it("GET /api/store/[slug] reuses store SSOT and eligible listings", () => {
    const route = read("app/api/store/[slug]/route.ts");
    expect(route).toContain("resolveStoreByRouteParam");
    expect(route).toContain('surface: "seller"');
    expect(route).toContain("getEligibleListings");
    expect(route).toContain("getFollowCounts");
    expect(route).toContain('kind: "unavailable"');
    expect(route).toContain("resolveSellerAccountType");
    expect(route).toContain("businessName: store.businessName");
    expect(route).not.toContain("tax_id");
    expect(route).not.toContain("VAT number");
    expect(route).not.toContain("seedDemoListings");
    expect(route).not.toContain("London, United Kingdom");
    expect(route).not.toContain("Responds within");
    expect(route).not.toContain("listingCount");
    expect(route).not.toContain("salesCount");
  });
});
