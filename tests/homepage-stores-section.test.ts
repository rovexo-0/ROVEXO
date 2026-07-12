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

  it("has no section title and responsive peek rail", () => {
    const sectionCss = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const tsx = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");

    expect(sectionCss).toContain("--hp-store-visible");
    expect(sectionCss).toContain("container-name: hp-featured-store");
    expect(tsx).toContain('data-hp-featured-store-version="v1.0-canonical"');
    expect(tsx).toContain("StoreProfileCard");
    expect(tsx).not.toContain("STORES");
    expect(tsx).not.toContain("Featured Listings");
    expect(tsx).not.toContain("slice(");
    expect(tsx).not.toContain("View Store");
  });

  it("locks responsive header with stars, visit store, and follow", () => {
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const header = readSource("components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx");

    expect(css).toContain("clamp(48px, 13cqi, 52px)");
    expect(css).toContain(".headerActions");
    expect(header).toContain("Visit Store");
    expect(header).toContain("FollowSellerButton");
    expect(header).not.toContain("resolveStoreBadge");
    expect(header).not.toContain("reviewCount");
    expect(header).not.toContain('"Featured"');
    expect(header).not.toContain("headerBadge");
  });

  it("uses ListingCard in the featured store carousel without featured badges", () => {
    const section = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");
    const profile = readSource("components/homepage/canonical/featured-store/StoreProfileCard.tsx");

    expect(section).toContain("ListingCard");
    expect(section).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(profile).not.toContain("resolveStoreBadge");
    expect(profile).not.toContain("profileBadge");
  });

  it("removes legacy FeaturedStoreProductCard", () => {
    const legacyPath = join(
      process.cwd(),
      "components/homepage/canonical/featured-store/FeaturedStoreProductCard.tsx",
    );
    expect(existsSync(legacyPath)).toBe(false);
  });
});
