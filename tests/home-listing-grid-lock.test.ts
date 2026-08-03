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

    expect(homepage).toContain("repeat(var(--hp-grid-cols, 2), minmax(0, 1fr))");
    expect(homepage).not.toContain("--hp-grid-cols: 3");
    expect(homepage).toContain('data-listing-card="rovexo"');
  });

  it("does not stretch the last odd ListingCard to full row width", () => {
    const homepage = readSource("components/homepage/canonical/CanonicalHomepage.module.css");

    expect(homepage).not.toContain(":last-child:nth-child(odd)");
    expect(homepage).not.toMatch(
      /\[data-listing-card="rovexo"\]:last-child[^\{]*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
    );
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
    expect(defaults).toContain("showViews: true");
    expect(card).toContain("bodyHomepage");
    expect(card).toContain("metaRowHomepage");
    expect(card).toContain("formatListingPriceIncl");
    expect(card).toContain("inclShieldHomepage");
    expect(card).toContain("ShieldLineIcon");
    expect(card).toContain("SafeImage");
    expect(card).not.toContain("ShieldCheck");
    expect(card).not.toContain('from "lucide-react"');
    expect(card).not.toContain("formatPlatformFeeLine");
  });

  it("formats inclusive total for homepage cards", async () => {
    const { formatListingPriceIncl } = await import("@/lib/listing-card/format");

    expect(formatListingPriceIncl(20)).toBe("£21.10 incl.");
    expect(formatListingPriceIncl(100)).toBe("£105.50 incl.");
    // Absolute Total Price Law: item + shipping + platform fee
    expect(formatListingPriceIncl(1, 3)).toBe("£4.06 incl.");
    expect(formatListingPriceIncl(10, 3)).toBe("£13.55 incl.");
  });

  it("prefers listing shipping over live quote for payable total", async () => {
    const { getDeliveryPrice } = await import("@/lib/checkout/delivery");

    expect(
      getDeliveryPrice({
        listingShippingPrice: 3,
        selectedQuote: {
          id: "q1",
          carrier: "Royal Mail",
          serviceName: "Tracked",
          price: 9.99,
          eta: "1-2 days",
        },
      }),
    ).toBe(3);
  });

  it("formats card footer rating and views from listing data", async () => {
    const { formatCardRating, formatCardViews } = await import("@/components/ui/ListingCard");

    expect(formatCardRating({ rating: 4.9, reviewCount: 12 })).toBe("4.9");
    expect(formatCardRating({ rating: 0, reviewCount: 0 })).toBe("0.0");
    expect(formatCardViews(1200)).toBe("1.2K");
    expect(formatCardViews(0)).toBe("0");
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

  it("never mounts infinite-scroll sentinel inside the CSS listing grid", () => {
    const feed = readSource("components/homepage/canonical/CanonicalMarketplaceFeed.tsx");
    const css = readSource("components/homepage/canonical/CanonicalHomepage.module.css");

    // Forced hasMore from seed length created a phantom blank grid cell.
    expect(feed).not.toContain("initialPage.hasMore || seedItems.length > 0");
    expect(feed).toContain("Boolean(initialPage.hasMore)");
    // Sentinel must be a sibling of the grid, not a grid child.
    expect(feed).toContain("Sentinel MUST stay outside the CSS grid");
    expect(feed.indexOf("feedSentinel")).toBeGreaterThan(feed.lastIndexOf("feedGrid"));
    expect(css).toContain(".feedSentinel");
    expect(css).toContain("visibility: hidden");
    expect(css).not.toMatch(/\.feedSentinel\s*\{[^}]*grid-column/s);
  });

  it("uses canonical featured store with ListingCard carousel", () => {
    const store = readSource("components/homepage/canonical/featured-store/FeaturedStoreSection.tsx");
    const css = readSource("components/homepage/canonical/featured-store/FeaturedStore.module.css");

    expect(store).toContain("FeaturedStoreHeader");
    expect(store).toContain("ListingCard");
    expect(store).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(store).not.toContain("StoreProfileCard");
    expect(store).toContain('data-hp-featured-store-version="v1.0-canonical"');
    expect(css).toContain("--hp-store-card-ref-w");
    expect(css).toContain("--hp-store-visible-cards: 2.5");
  });

  it("places search beside ROVEXO — identical marketplace chrome", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const provider = readSource("features/header/HeaderProvider.tsx");

    expect(header).toContain("rx-h2__search");
    expect(header).toContain("HomepageSearchField");
    expect(header).toContain('SEARCH_FIELD_ID = "rx-h2-search"');
    expect(provider).toContain('layout="default"');
    expect(provider).toContain("SEARCH_PRIORITY_FREEZE_V1");
  });

  it("uses official ROVEXO canonical logo on Homepage header", () => {
    const wordmark = readSource("components/brand/RovexoWordmark.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    const css = readSource("styles/rovexo/header-v2.css");

    expect(wordmark).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(css).toContain("rx-h2__logo-img");
  });

  it("uses canonical homepage bottom navigation labels", () => {
    const nav = readSource("lib/homepage/canonical-nav.ts");
    const page = readSource("app/(platform)/page.tsx");

    expect(nav).toContain('label: "Browse"');
    expect(nav).toContain('label: "Inbox"');
    expect(nav).toContain('label: "Account"');
    expect(nav).not.toContain('label: "Search"');
    expect(nav).not.toContain('label: "Profile"');
    expect(nav).toContain('href: "/inbox"');
    expect(page).toContain("HP_CANONICAL_BOTTOM_NAV");
  });

  it("uses canonical search placeholder without camera icon on Homepage", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");

    expect(search).toContain("SEARCH_SYSTEM_V1.placeholder");
    expect(search).toContain("SearchBarSearchIcon");
    expect(search).not.toContain("ImageSearchCamera");
    expect(header).toContain('SEARCH_FIELD_ID = "rx-h2-search"');
    expect(header).toContain('data-header-search-first="true"');
  });

  it("uses canonical homepage stack only", () => {
    const homePage = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const page = readSource("app/(platform)/page.tsx");

    expect(page).toContain("CanonicalHomepage");
    expect(homePage).toContain("FeaturedStoreSection");
    expect(homePage).toContain("CanonicalMarketplaceFeed");
    expect(homePage).not.toContain("HomepageV4Featured");
    expect(homePage).toContain('data-hp-homepage-version="phase-2-refinement-01"');
  });
});
