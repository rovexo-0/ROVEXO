import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveHomepageMode } from "@/lib/homepage/config";
import {
  HomepageEligibility,
  type HomepageListingInput,
} from "@/lib/homepage/homepage-eligibility";
import { REAL_PRODUCTS_ONLY_V5 } from "@/lib/real-products-only-v5";
import { seedDemoListings } from "@/lib/demo-environment/listings";

describe("Absolute Law v5.0 — real products only", () => {
  it("locks SSOT permanent freeze", () => {
    expect(REAL_PRODUCTS_ONLY_V5.version).toBe("5.0");
    expect(REAL_PRODUCTS_ONLY_V5.permanent).toBe(true);
    expect(REAL_PRODUCTS_ONLY_V5.emptyMarketplace.cta).toBe("SELL NOW");
    expect(Object.isFrozen(REAL_PRODUCTS_ONLY_V5)).toBe(true);
  });

  it("does not ship in-memory demo catalogue files", () => {
    const root = process.cwd();
    expect(existsSync(join(root, "lib/demo-mode/canonical-listings.ts"))).toBe(false);
    expect(existsSync(join(root, "lib/homepage/demo-data.ts"))).toBe(false);
  });

  it("homepage mode never resolves to demo catalogue mode", () => {
    expect(resolveHomepageMode()).not.toBe("demo" as never);
  });

  it("rejects demo / fake / mock / placeholder / test-listing / RUN4 slugs", () => {
    const base: HomepageListingInput = {
      status: "published",
      title: "Gaming Chair",
      description: "A real-looking description that is long enough.",
      price: 99,
      categoryId: "cat-1",
      imageUrl: "/icons/categories/phones.svg",
      imageCount: 1,
      sellerVerified: true,
      sellerAccountStatus: "active",
      moderationStatus: "approved",
      slug: "demo-gaming-chair",
    };
    for (const slug of [
      "demo-gaming-chair",
      "fake-item-1",
      "mock-product-1",
      "placeholder-listing-1",
      "test-listing-001",
      "canonical-demo-1",
      "run4-cert-listing-001",
      "run-test-item-1",
      "fixture-item-1",
      "seed-item-1",
      "certification-listing-1",
    ]) {
      const result = HomepageEligibility.evaluate({ ...base, slug });
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("DEMO_NOT_ALLOWED");
    }
  });

  it("permanently disables seedDemoListings", async () => {
    await expect(
      seedDemoListings({ admin: {} as never, sellers: [] }),
    ).rejects.toThrow(/ABSOLUTE_LAW_V5/);
  });

  it("empty marketplace UI uses Absolute Law v5 copy", () => {
    const source = readFileSync(
      join(process.cwd(), "components/homepage/canonical/HomepageEmptyState.tsx"),
      "utf8",
    );
    expect(source).toContain("ROVEXO MARKETPLACE");
    expect(source).toContain("No listings available.");
    expect(source).toContain("Be the first to sell on ROVEXO.");
    expect(source).toContain("SELL NOW");
    expect(source).not.toContain("Browse search");
  });

  it("product detail does not pad galleries with official demo images", () => {
    const source = readFileSync(join(process.cwd(), "lib/products/detail.ts"), "utf8");
    expect(source).not.toContain("OFFICIAL_DEMO_PRODUCT_IMAGES");
    expect(source).not.toContain("resolveOfficialDemoProductImage");
  });
});
