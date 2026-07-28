import { describe, expect, it } from "vitest";
import {
  CANONICAL_PROMOTION_TOOL_IDS,
  BOOST_PACKAGE_TIERS,
  getCanonicalPromotionEntries,
} from "@/lib/promotions/canonical-tools";
import {
  DEFAULT_PROMOTION_CATALOG,
  resolvePromotionCatalog,
} from "@/lib/promotions/catalog";
import { DEFAULT_MARKETPLACE_PRICING } from "@/lib/promotions/marketplace-pricing";

describe("canonical promotion tools", () => {
  it("exposes exactly three account promotion tools", () => {
    expect(CANONICAL_PROMOTION_TOOL_IDS).toEqual(["bump", "store_featured", "boost"]);
  });

  it("resolves canonical catalog entries with spec pricing", () => {
    const resolved = resolvePromotionCatalog(DEFAULT_PROMOTION_CATALOG, DEFAULT_MARKETPLACE_PRICING);
    const canonical = getCanonicalPromotionEntries(resolved);

    expect(canonical.map((entry) => entry.id)).toEqual(["bump", "store_featured", "boost"]);
    expect(canonical.find((entry) => entry.id === "bump")?.resolvedPriceCents).toBe(130);
    expect(canonical.find((entry) => entry.id === "store_featured")?.resolvedPriceCents).toBe(630);
    expect(canonical.find((entry) => entry.id === "bump")?.ctaLabel).toBe("BUMP MY LISTING");
    expect(canonical.find((entry) => entry.id === "store_featured")?.ctaLabel).toBe("PROMOTE STORE");
    expect(canonical.find((entry) => entry.id === "boost")?.ctaLabel).toBe("BOOST NOW");
    expect(canonical.find((entry) => entry.id === "boost")?.resolvedPriceCents).toBe(1200);
    expect(canonical.find((entry) => entry.id === "bump")?.benefits).toEqual([
      "More visibility",
      "Higher search placement",
      "Instant activation",
    ]);
    expect(canonical.find((entry) => entry.id === "store_featured")?.benefits).toEqual([
      "Entire store visibility",
      "Featured exposure",
      "Automatic expiration",
    ]);
    expect(canonical.find((entry) => entry.id === "boost")?.benefits).toEqual([
      "Store Showcase included",
      "Auto bump all active listings",
      "Maximum visibility",
    ]);
  });

  it("maps checkout return types to Owner success copy", async () => {
    const { resolvePromotionSuccessMessage } = await import("@/lib/promotions/success-copy");
    expect(resolvePromotionSuccessMessage("bump")).toBe(
      "Bump Listing activated successfully. Your promotion is now live. Expires in: 7 Days.",
    );
    expect(resolvePromotionSuccessMessage("store_featured")).toBe(
      "Store Showcase activated successfully. Your promotion is now live. Expires in: 7 Days.",
    );
    expect(resolvePromotionSuccessMessage("boost_package")).toBe(
      "Boost Package activated successfully. Your promotion is now live. Expires in: 7 Days.",
    );
  });

  it("exposes optimized ROVEXO 2026 promote illustrations", async () => {
    const { getPromoteIllustration } = await import("@/lib/promotions/illustrations");
    expect(getPromoteIllustration("search-bump").src).toContain("promote-bump-listing-2026.webp");
    expect(getPromoteIllustration("store-featured").src).toContain("promote-store-showcase-2026.webp");
    expect(getPromoteIllustration("feed-boost").src).toContain("promote-boost-package-2026.webp");
  });

  it("defines boost package tiers for 7, 14 and 28 days", () => {
    expect(BOOST_PACKAGE_TIERS.map((tier) => tier.id)).toEqual(["7d", "14d", "28d"]);
  });
});
