import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Canonical Featured Store — homepage rebuild", () => {
  it("locks portrait preview cards with fluid 112:206 proportions", () => {
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");

    expect(css).toContain("aspect-ratio: var(--hp-store-card-aspect, 112 / 206)");
    expect(css).toContain("--hp-store-card-ref-w");
    expect(css).toContain("width: clamp(26px, 8cqi, 28px)");
    expect(css).toContain("width: clamp(14px, 4.5cqi, 16px)");
    expect(css).toContain(".productTotal");
  });

  it("has no section title and responsive peek rail", () => {
    const sectionCss = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const tsx = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");

    expect(sectionCss).toContain("--hp-store-visible");
    expect(sectionCss).toContain("container-name: hp-featured-store");
    expect(tsx).toContain('data-hp-featured-store-version="phase-2-module-01"');
    expect(tsx).toContain("StoreProfileCard");
    expect(tsx).not.toContain("STORES");
    expect(tsx).not.toContain("View Store");
  });

  it("locks responsive header avatar with review count", () => {
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");
    const tsx = readSource("components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx");

    expect(css).toContain("clamp(48px, 13cqi, 52px)");
    expect(css).toContain(".reviewCount");
    expect(tsx).toContain("reviewCount");
    expect(tsx).toContain("Visit Store");
  });

  it("uses ListingCard in the featured store carousel", () => {
    const section = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");
    expect(section).toContain("ListingCard");
    expect(section).toContain("HP_CANONICAL_LISTING_PROPS");
  });
});
