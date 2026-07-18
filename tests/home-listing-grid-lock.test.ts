import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
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

  it("locks homepage feed to two columns", () => {
    const homepage = readSource("components/homepage/canonical/CanonicalHomepage.module.css");

    expect(homepage).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(homepage).not.toContain("--hp-grid-cols: 3");
  });

  it("uses purple category chips on homepage", () => {
    const homepage = readSource("components/homepage/canonical/CanonicalHomepage.module.css");

    expect(homepage).toContain("background: var(--ds-color-primary)");
    expect(homepage).toContain("color: #ffffff");
  });

  it("uses phase 2 compact homepage listing props", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const defaults = readSource("lib/listing-card/defaults.ts");

    expect(defaults).toContain("showStatusBadge: false");
    expect(defaults).toContain("showPlatformFee: false");
    expect(defaults).toContain("showBuyerProtection: true");
    expect(defaults).toContain("showCondition: true");
    expect(defaults).toContain("showSeller: false");
    expect(defaults).toContain("showRating: true");
    expect(card).toContain("bodyHomepage");
    expect(card).toContain("metaRowHomepage");
    expect(card).toContain("formatListingPriceIncl");
    expect(card).toContain("inclShieldHomepage");
    expect(card).toContain("ShieldCheck");
    expect(card).not.toContain("formatPlatformFeeLine");
  });

  it("formats inclusive total for homepage cards", async () => {
    const { formatListingPriceIncl } = await import("@/lib/listing-card/format");

    expect(formatListingPriceIncl(20)).toBe("£21.10 incl.");
    expect(formatListingPriceIncl(100)).toBe("£105.50 incl.");
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

  it("uses canonical featured store with ListingCard carousel", () => {
    const store = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");

    expect(store).toContain("FeaturedStoreHeader");
    expect(store).toContain("ListingCard");
    expect(store).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(store).toContain("StoreProfileCard");
    expect(store).toContain('data-hp-featured-store-version="v1.0-canonical"');
    expect(css).toContain("--hp-store-card-ref-w");
  });

  it("places search below header on homepage without logo or notification icon", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const page = readSource("app/page.tsx");

    expect(header).toContain('layout?: "default" | "homepage"');
    expect(header).toContain("rx-h2__search-row");
    expect(header).toContain("!isHomepageLayout");
    expect(page).toContain('layout="homepage"');
  });

  it("uses official ROVEXO wordmark colours", () => {
    const wordmark = readSource("components/brand/RovexoWordmark.tsx");
    const css = readSource("styles/rovexo/header-v2.css");

    expect(wordmark).toContain("rx-wordmark__x");
    expect(css).toContain("#111111");
    expect(css).toContain("ds-color-primary");
  });

  it("uses canonical homepage bottom navigation labels", () => {
    const nav = readSource("lib/homepage/canonical-nav.ts");
    const page = readSource("app/page.tsx");

    expect(nav).toContain('label: "Search"');
    expect(nav).toContain('label: "Inbox"');
    expect(nav).toContain('label: "Account"');
    expect(nav).not.toContain('label: "Browse"');
    expect(nav).not.toContain('label: "Profile"');
    expect(nav).toContain('href: "/inbox"');
    expect(page).toContain("HP_CANONICAL_BOTTOM_NAV");
  });

  it("uses canonical search placeholder and camera control", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const camera = readSource("components/home/ImageSearchCamera.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");

    expect(search).toContain("Search for items or members");
    expect(search).toContain("ImageSearchCamera");
    expect(camera).toContain("homepage-search__camera");
    expect(camera).toContain("Camera");
    expect(header).toContain("hp-canonical-search");
  });

  it("uses canonical homepage stack only", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const page = readSource("app/page.tsx");

    expect(page).toContain("CanonicalHomepage");
    expect(homePage).toContain("FeaturedStoreSection");
    expect(homePage).toContain("CanonicalMarketplaceFeed");
    expect(homePage).not.toContain("HomepageV4Featured");
    expect(homePage).toContain('data-hp-homepage-version="phase-2-refinement-01"');
  });
});
