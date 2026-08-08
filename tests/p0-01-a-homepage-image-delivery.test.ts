import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("P0-01-A — Homepage listing image delivery", () => {
  it("defines surface-accurate feed and showcase sizes constants", () => {
    const constants = readSource("components/homepage/canonical/constants.ts");
    expect(constants).toContain("HP_FEED_LISTING_IMAGE_SIZES");
    expect(constants).toContain("HP_SHOWCASE_LISTING_IMAGE_SIZES");
    expect(constants).toContain(
      '(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px',
    );
    expect(constants).toContain(
      '(max-width: 639px) 112px, (max-width: 1023px) 120px, 128px',
    );
  });

  it("wires showcase to showcase sizes and a single LCP priority card", () => {
    const section = readSource(
      "components/homepage/canonical/featured-store/FeaturedStoreSection.tsx",
    );
    expect(section).toContain("HP_SHOWCASE_LISTING_IMAGE_SIZES");
    expect(section).toContain("imageSizes={HP_SHOWCASE_LISTING_IMAGE_SIZES}");
    expect(section).toContain("priority={index === 0}");
    expect(section).not.toContain("priority={index < 3}");
  });

  it("wires feed to feed sizes and LCP only when showcase is absent", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");
    const home = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    expect(feed).toContain("HP_FEED_LISTING_IMAGE_SIZES");
    expect(feed).toContain("imageSizes={HP_FEED_LISTING_IMAGE_SIZES}");
    expect(feed).toContain("lcpImagePriority");
    expect(feed).toContain("priority={lcpImagePriority && index === 0}");
    expect(feed).not.toContain("priority={index < 2}");
    expect(home).toContain("selectHomepageFeaturedStore");
    expect(home).toContain("lcpImagePriority={!showcaseOwnsLcp}");
  });

  it("does not change ListingCard default sizes or SafeImage / next.config images", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const safe = readSource("components/ui/SafeImage.tsx");
    const nextConfig = readSource("next.config.ts");
    expect(card).toContain(
      'const IMG_SIZES = "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px"',
    );
    expect(safe).toContain('resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined)');
    expect(nextConfig).not.toContain("deviceSizes");
    expect(nextConfig).not.toContain("imageSizes:");
  });
});
