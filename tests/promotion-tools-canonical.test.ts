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
    expect(canonical.find((entry) => entry.id === "store_featured")?.resolvedPriceCents).toBe(600);
    expect(canonical.find((entry) => entry.id === "bump")?.ctaLabel).toBe("Select Listing");
    expect(canonical.find((entry) => entry.id === "store_featured")?.ctaLabel).toBe(
      "Activate Featured Store",
    );
    expect(canonical.find((entry) => entry.id === "boost")?.ctaLabel).toBe("Choose Package");
  });

  it("defines boost package tiers for 7, 14 and 28 days", () => {
    expect(BOOST_PACKAGE_TIERS.map((tier) => tier.id)).toEqual(["7d", "14d", "28d"]);
  });
});
