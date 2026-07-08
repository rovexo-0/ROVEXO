import { describe, expect, it } from "vitest";

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function walkTsxFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "hooks") walkTsxFiles(full, files);
      continue;
    }
    if (entry.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const FORBIDDEN_HOMEPAGE_CARD_NAMES = [
  "FeaturedCard",
  "PremiumCard",
  "BoostCard",
  "NewListingCard",
  "CompactListingCard",
  "RailCard",
  "MiniListingCard",
  "ProductCard",
];

describe("Official Listing Card — homepage grid lock", () => {
  it("locks official listing card with image-first layout", () => {
    const cardCss = readSource("components/ui/ListingCard.module.css");

    expect(cardCss).toContain("aspect-ratio: var(--rx-listing-image-ratio");
    expect(cardCss).toContain(".protection");
    expect(cardCss).toContain(".footer");
    expect(cardCss).toContain("var(--ds-color-primary)");
  });

  it("uses responsive homepage feed grid", () => {
    const homepage = readSource("components/homepage/canonical/CanonicalHomepage.module.css");
    const responsive = readSource("styles/homepage-canonical-responsive.css");

    expect(homepage).toContain("container-name: hp-feed");
    expect(homepage).toContain("column-gap: var(--hp-grid-gap");
    expect(responsive).toContain("--hp-grid-gap");
  });

  it("renders buyer protection and seller footer on homepage", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const defaults = readSource("lib/listing-card/defaults.ts");

    expect(defaults).toContain("showStatusBadge: true");
    expect(defaults).toContain("showBuyerProtection: true");
    expect(defaults).toContain("showSeller: true");
    expect(card).toContain("formatListingPriceIncl");
    expect(card).toContain("IconStar");
    expect(card).toContain("sellerAvatar");
  });

  it("formats card footer rating and views from listing data", async () => {
    const { formatCardRating, formatCardViews } = await import("@/components/ui/ListingCard");

    expect(formatCardRating({ rating: 4.9, reviewCount: 12 })).toBe("4.9");
    expect(formatCardRating({ rating: 0, reviewCount: 0 })).toBe("—");
    expect(formatCardViews(1200)).toBe("1.2K");
  });

  it("omits section titles on canonical homepage", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");
    const store = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");

    expect(feed).not.toContain(">Marketplace<");
    expect(store).not.toContain("STORES");
  });

  it("requires the homepage feed to use the official ListingCard", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");

    expect(feed).toContain('@/components/ui/ListingCard"');
    expect(feed).toContain("HP_CANONICAL_LISTING_PROPS");

    for (const forbidden of FORBIDDEN_HOMEPAGE_CARD_NAMES) {
      expect(feed, `must not reference ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("uses canonical featured store with responsive carousel", () => {
    const store = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");

    expect(store).toContain("FeaturedStoreHeader");
    expect(store).toContain("FeaturedStoreProductCard");
    expect(store).toContain("StoreProfileCard");
    expect(store).toContain('data-hp-featured-store-version="ui-lock-1.0"');
    expect(css).toContain("--hp-store-card-ref-w");
    expect(css).toContain("aspect-ratio: var(--hp-store-card-aspect");
  });

  it("uses canonical homepage stack only", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const page = readSource("app/page.tsx");

    expect(page).toContain("CanonicalHomepage");
    expect(homePage).toContain("FeaturedStoreSection");
    expect(homePage).toContain("CanonicalMarketplaceFeed");
    expect(homePage).not.toContain("HomepageV4Featured");
    expect(homePage).toContain('data-hp-homepage="canonical"');
  });
});
