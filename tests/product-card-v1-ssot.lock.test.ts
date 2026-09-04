import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "archive" || name === "tests") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsx(full, out);
    else if (name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const FORBIDDEN_CARD_NAMES = [
  "FeaturedCard",
  "PremiumCard",
  "FavouritesCard",
  "SearchCard",
  "SellerCard",
  "RelatedProductsCard",
  "RecommendedCard",
  "ProductCardV2",
  "ListingCardV2",
  "HomepageCard",
  "FeaturedStoreProductCard",
];

describe("ROVEXO Product Card v1.0 — platform SSOT lock", () => {
  it("locks canonical prop bundle (rating/views off on Homepage)", () => {
    const defaults = readSource("lib/listing-card/defaults.ts");
    expect(defaults).toContain("LISTING_CARD_HOMEPAGE_PROPS");
    expect(defaults).toContain("ROVEXO_PRODUCT_CARD_PROPS");
    expect(defaults).toContain("showViews: false");
    expect(defaults).toContain("showSeller: false");
    expect(defaults).toContain("showFavorite: true");
    expect(defaults).toContain("showRating: false");
    expect(defaults).toContain("showCondition: true");
    expect(defaults).toContain('surface: "homepage"');
  });

  it("homepage card retains price, incl, title, condition markup (rating/views gated off)", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("priceHomepage");
    expect(card).toContain("inclTotalHomepage");
    expect(card).toContain("titleHomepage");
    expect(card).toContain("conditionHomepage");
    expect(card).toContain("ratingHomepage");
    expect(card).toContain("viewsHomepage");
    expect(card).toContain("formatListingPriceIncl");
    expect(card).toContain('data-product-card-stats="v1.0"');
  });

  it("aliases HP_CANONICAL / HP3 / HP4 to the same homepage props", () => {
    expect(readSource("components/homepage/canonical/constants.ts")).toContain(
      "LISTING_CARD_HOMEPAGE_PROPS",
    );
    expect(readSource("components/homepage-v3/constants.ts")).toContain(
      "LISTING_CARD_HOMEPAGE_PROPS",
    );
    expect(readSource("components/homepage-v4/constants.ts")).toContain(
      "LISTING_CARD_HOMEPAGE_PROPS",
    );
  });

  it("Search, Categories, Favourites, Seller, Similar use canonical props", () => {
    const files = [
      "features/search/components/SearchResultsView.tsx",
      "features/categories/components/CategoryPageView.tsx",
      "features/account-module/components/SavedItemsV1.tsx",
      "features/profile/components/ViewProfilePage.tsx",
      "features/product-detail/ProductSimilarItems.tsx",
      "features/product-detail/ProductRecentlyViewed.tsx",
      "features/account-center/components/RecentlyViewedPage.tsx",
      "features/store/components/ProStorePage.tsx",
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, file).toMatch(/HP_CANONICAL_LISTING_PROPS|LISTING_CARD_HOMEPAGE_PROPS/);
    }
  });

  it("forbids parallel product card component names in app/features/components", () => {
    const roots = ["app", "features", "components"].map((d) => join(process.cwd(), d));
    const files = roots.flatMap((root) => walkTsx(root));
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const name of FORBIDDEN_CARD_NAMES) {
        expect(source, `${file} must not define/use ${name}`).not.toContain(`function ${name}`);
        expect(source, `${file} must not define/use ${name}`).not.toContain(`const ${name}`);
      }
    }
  });

  it("Favourites empty state matches LIVE production lock and Browse → /search", () => {
    const page = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(page).toContain("Nothing saved");
    expect(page).toContain("Browse");
    expect(page).toContain('href="/search"');
    expect(page).not.toContain("♡");
  });
});
