import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROMOTION_CATALOG,
  formatPromotionPrice,
  resolvePromotionCatalog,
} from "@/lib/promotions/catalog";
import { DEFAULT_MARKETPLACE_PRICING } from "@/lib/promotions/marketplace-pricing";

describe("promotion catalog", () => {
  it("defines five promotion card types matching v1.0", () => {
    expect(DEFAULT_PROMOTION_CATALOG.entries).toHaveLength(5);
    expect(DEFAULT_PROMOTION_CATALOG.entries.map((entry) => entry.id)).toEqual([
      "bump",
      "store_featured",
      "boost",
      "featured",
      "premium",
    ]);
  });

  it("formats promotion prices in GBP", () => {
    expect(formatPromotionPrice(149)).toBe("£1.49");
    expect(formatPromotionPrice(999)).toBe("£9.99");
  });

  it("resolves marketplace-linked pricing for bump and featured store", () => {
    const resolved = resolvePromotionCatalog(DEFAULT_PROMOTION_CATALOG, DEFAULT_MARKETPLACE_PRICING);
    const bump = resolved.entries.find((entry) => entry.id === "bump");
    const storeFeatured = resolved.entries.find((entry) => entry.id === "store_featured");

    expect(bump?.resolvedPriceCents).toBe(
      DEFAULT_MARKETPLACE_PRICING.boost.find((tier) => tier.id === "7d")?.priceCents,
    );
    expect(storeFeatured?.resolvedPriceCents).toBe(DEFAULT_MARKETPLACE_PRICING.showcase.priceCents);
  });

  it("filters disabled and hidden entries", () => {
    const config = {
      ...DEFAULT_PROMOTION_CATALOG,
      entries: DEFAULT_PROMOTION_CATALOG.entries.map((entry) =>
        entry.id === "premium" ? { ...entry, enabled: false } : entry,
      ),
    };

    const resolved = resolvePromotionCatalog(config, DEFAULT_MARKETPLACE_PRICING);
    expect(resolved.entries.some((entry) => entry.id === "premium")).toBe(false);
  });

  it("exports promotion card components", async () => {
    const cards = await import("@/components/promotions/cards-v1");
    expect(cards.PromotionCard).toBeTypeOf("function");
    expect(cards.PromotionPreview).toBeTypeOf("function");
    expect(cards.PromotionBenefits).toBeTypeOf("function");
    expect(cards.PromotionPrice).toBeTypeOf("function");
    expect(cards.PromotionButton).toBeTypeOf("function");
    expect(cards.PromotionBadge).toBeTypeOf("function");
  });
});
