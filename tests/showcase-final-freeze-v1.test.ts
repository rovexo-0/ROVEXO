import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatShowcaseProductCount,
  SHOWCASE_LISTING_CARD_DENSITY,
  SHOWCASE_LISTING_MAX,
  SHOWCASE_RAIL_MAX_ITEMS,
  SHOWCASE_VIEW_ALL_COPY,
  SHOWCASE_VIEW_ALL_SLOT,
  takeShowcaseListings,
} from "@/lib/homepage/showcase-final-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Homepage Showcase Final Freeze", () => {
  it("locks 9 listings + 1 View All · newest first", () => {
    expect(SHOWCASE_LISTING_MAX).toBe(9);
    expect(SHOWCASE_VIEW_ALL_SLOT).toBe(10);
    expect(SHOWCASE_RAIL_MAX_ITEMS).toBe(10);
    expect(SHOWCASE_LISTING_CARD_DENSITY).toBe("visit");
    expect(SHOWCASE_VIEW_ALL_COPY).toEqual({
      title: "VIEW ALL",
      tapHint: "Tap to open Store",
    });
    expect(formatShowcaseProductCount(92)).toBe("92 Products");
    expect(formatShowcaseProductCount(1)).toBe("1 Product");

    const sorted = takeShowcaseListings([
      { id: "old", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "new", createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "mid", createdAt: "2026-03-01T00:00:00.000Z" },
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `x${i}`,
        createdAt: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      })),
    ]);
    expect(sorted).toHaveLength(9);
    expect(sorted[0]?.id).toBe("new");
  });

  it("wires FeaturedStoreSection: ListingCard SSOT + single View All · no infinite scroll", () => {
    const section = readSource(
      "components/homepage/canonical/featured-store/FeaturedStoreSection.tsx",
    );
    expect(section).toContain("takeShowcaseListings");
    expect(section).toContain("SHOWCASE_LISTING_CARD_DENSITY");
    expect(section).toContain("ShowcaseViewAllCard");
    expect(section).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(section).toContain("storeListingCardAttr");
    expect(section).toContain("data-hp-showcase={SHOWCASE_FINAL_DOM_VALUE}");
    expect(section).not.toContain("SHOWCASE_LISTING_COUNT = 10");
    expect(section).toContain("<ShowcaseViewAllCard");
  });

  it("View All card opens Store and shows product count copy", () => {
    const card = readSource(
      "components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx",
    );
    const css = readSource(
      "components/homepage/canonical/featured-store/FeaturedStore.module.css",
    );
    const lock = readSource("lib/homepage/showcase-final-freeze-v1.ts");
    expect(card).toContain("formatShowcaseProductCount");
    expect(card).toContain("SHOWCASE_VIEW_ALL_COPY");
    expect(card).toContain('data-hp-showcase-view-all="v1.0"');
    expect(lock).toContain('title: "VIEW ALL"');
    expect(lock).toContain('tapHint: "Tap to open Store"');
    expect(css).toContain(".viewAllCard");
    expect(css).toContain("min-height: 250px");
  });

  it("does not alter Store page wiring", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    const proStore = readSource("features/store/components/ProStorePage.tsx");
    expect(profile).toContain('isOwnProfile ? "store" : "visit"');
    expect(proStore).toContain('storeListingCardAttr("business")');
    expect(profile).not.toContain("ShowcaseViewAllCard");
    expect(proStore).not.toContain("ShowcaseViewAllCard");
  });
});
