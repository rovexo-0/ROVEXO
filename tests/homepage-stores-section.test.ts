import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Canonical Featured Store — homepage rebuild", () => {
  it("locks smaller portrait carousel cards at 112px reference width", () => {
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");

    expect(css).toContain("--hp-store-card-ref-w");
    expect(css).toContain("flex: 0 0 var(--hp-store-card-w)");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).not.toContain(".product ");
  });

  it("has no section title and locks 2.5-card horizontal showcase", () => {
    const sectionCss = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const tsx = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");

    expect(sectionCss).toContain("--hp-store-visible");
    expect(sectionCss).toContain("--hp-store-visible-cards: 2.5");
    expect(sectionCss).toContain("container-name: hp-featured-store");
    expect(tsx).toContain('data-hp-featured-store-version="v1.0-canonical"');
    expect(tsx).toContain("takeShowcaseListings");
    expect(tsx).toContain("ShowcaseViewAllCard");
    expect(tsx).toContain("FeaturedStoreHeader");
    expect(tsx).not.toContain("StoreProfileCard");
    expect(tsx).not.toContain("STORES");
    expect(tsx).not.toContain("Featured Listings");
    expect(tsx).not.toContain("See More");
    expect(tsx).not.toContain("Get Showcase");
    expect(tsx).not.toContain("View Store");
  });

  it("locks Showcase Store Header v2.0 — identity opens store, no Follow", () => {
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const header = readSource("components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx");

    expect(css).toContain("clamp(48px, 13cqi, 52px)");
    expect(css).toContain(".headerCard");
    expect(css).toContain("border-radius: 16px");
    expect(header).toContain('data-hp-store-header="v2.0"');
    expect(header).not.toContain("FollowSellerButton");
    expect(header).toContain("joinedText");
    expect(header).toContain("ratingText");
    expect(header).not.toContain("Visit Store");
    expect(header).not.toContain("PremiumButtonLink");
    expect(header).not.toContain("resolveStoreBadge");
    expect(header).not.toContain('"Featured"');
    expect(header).not.toContain("headerBadge");
  });

  it("uses ListingCard in the featured store carousel without featured badges", () => {
    const section = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");

    expect(section).toContain("ListingCard");
    expect(section).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(section).toContain("ShowcaseViewAllCard");
    expect(section).toContain('data-hp-showcase={SHOWCASE_FINAL_DOM_VALUE}');
  });

  it("removes legacy FeaturedStoreProductCard", () => {
    const legacyPath = join(
      process.cwd(),
      "components/homepage/canonical/featured-store/FeaturedStoreProductCard.tsx",
    );
    expect(existsSync(legacyPath)).toBe(false);
  });
});
