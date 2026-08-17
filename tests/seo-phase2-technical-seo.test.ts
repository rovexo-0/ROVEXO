import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOMEPAGE_SOCIAL_PREVIEW_V2 } from "@/lib/share/homepage";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { productPageMetadata, storePageMetadata } from "@/lib/seo/engine";
import { resolveListingLifecycle } from "@/lib/seo/engine/lifecycle";
import { isSitemapPathEligible } from "@/lib/seo/sitemaps/eligibility-filter";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("SEO Phase 2 — Technical SEO", () => {
  it("canonical homepage has exactly one meaningful visible H1", () => {
    const home = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const matches = home.match(/<h1\b/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(home).toContain("HOMEPAGE_SOCIAL_PREVIEW_V2.title");
    expect(home).toContain('data-hp-h1="phase-2"');
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title).toBe("ROVEXO — Buy • Sell • Grow");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title.toLowerCase()).toContain("rovexo");
    expect(home).toContain("CanonicalCategoryRail");
    expect(home).toContain("CanonicalMarketplaceFeed");
  });

  it("homepage title uses existing Social Preview SSOT without duplicate ROVEXO", () => {
    const page = readSource("app/(platform)/page.tsx");
    expect(page).toContain("title: { absolute: HOMEPAGE_OG_TITLE }");
    expect(page).toContain("HOMEPAGE_SOCIAL_PREVIEW_V2");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title).toBe("ROVEXO — Buy • Sell • Grow");
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title.match(/ROVEXO/g)?.length).toBe(1);
  });

  it("buildPageMetadata does not append a second ROVEXO suffix", () => {
    const branded = buildPageMetadata({
      title: "Vintage jacket · ROVEXO",
      description: "Buy a vintage jacket on ROVEXO.",
      path: "/listing/vintage-jacket",
    });
    expect(branded.title).toEqual({ absolute: "Vintage jacket · ROVEXO" });
    expect(branded.alternates?.canonical).toBeTruthy();

    const plain = buildPageMetadata({
      title: "Women's Fashion for Sale UK",
      description: "Shop women's fashion on ROVEXO.",
      path: "/category/womens-fashion",
    });
    expect(plain.title).toBe("Women's Fashion for Sale UK");
  });

  it("valid listing metadata is preserved through the existing engine", () => {
    const meta = productPageMetadata({
      title: "Nike Air Max",
      description: "Genuine pair in excellent condition.",
      slug: "nike-air-max",
      imageUrl: "https://cdn.example/nike.jpg",
    });
    expect(meta.title).toEqual({ absolute: "Nike Air Max · ROVEXO" });
    expect(meta.description).toContain("Genuine pair");
    expect(meta.alternates?.canonical).toMatch(/\/listing\/nike-air-max$/);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("valid category and store metadata remain indexable with a canonical", () => {
    const category = buildPageMetadata({
      title: "Electronics for Sale UK",
      description: "Shop electronics on ROVEXO.",
      path: "/category/electronics",
    });
    expect(category.title).toBe("Electronics for Sale UK");
    expect(category.alternates?.canonical).toMatch(/\/category\/electronics$/);
    expect(category.robots).toEqual({ index: true, follow: true });

    const store = storePageMetadata({
      name: "Acme Vintage",
      slug: "acme-vintage",
      listingCount: 12,
    });
    expect(store.title).toEqual({ absolute: "Acme Vintage · ROVEXO Store" });
    expect(store.alternates?.canonical).toMatch(/\/store\/acme-vintage$/);
    expect(store.robots).toEqual({ index: true, follow: true });
  });

  it("nonexistent listing keeps Owner soft-unavailable UI and is not a fake product page", () => {
    const listing = readSource("app/(platform)/listing/[slug]/page.tsx");
    expect(listing).not.toContain("notFound(");
    expect(listing).toContain("StoreUnavailablePage");
    expect(listing).toContain("omitCanonical: true");
    expect(listing).toContain("noIndex: true");
    expect(listing).toContain("productJsonLd");
    const pageFn = listing.slice(listing.indexOf("export default"));
    expect(pageFn.indexOf("StoreUnavailablePage")).toBeLessThan(pageFn.indexOf("productJsonLd"));
    expect(listing).not.toContain(`${STORE_UNAVAILABLE_COPY.title} · ROVEXO`);
  });

  it("nonexistent listing is noindex, has no Product/Offer JSON-LD, and is not sitemap-eligible", () => {
    const missing = buildPageMetadata({
      title: STORE_UNAVAILABLE_COPY.title,
      description: STORE_UNAVAILABLE_COPY.body,
      path: "/listing/missing",
      noIndex: true,
      omitCanonical: true,
    });
    expect(missing.robots).toEqual({ index: false, follow: false });
    expect(missing.alternates?.canonical).toBeUndefined();
    expect(missing.openGraph && "url" in missing.openGraph ? missing.openGraph.url : undefined).toBeUndefined();

    const lifecycle = resolveListingLifecycle({ productFound: false });
    expect(lifecycle.state).toBe("NOT_FOUND");
    expect(lifecycle.httpStatus).toBe(200);
    expect(lifecycle.indexation).toBe("NOINDEX");
    expect(lifecycle.structuredDataEligible).toBe(false);
    expect(lifecycle.sitemapEligible).toBe(false);

    expect(
      isSitemapPathEligible("/listing/missing", {
        pageType: "product",
        productFound: false,
      }),
    ).toBe(false);
  });

  it("404 metadata is noindex, has no canonical, and has no Product/Offer JSON-LD", () => {
    const notFound = readSource("app/not-found.tsx");
    expect(notFound).toContain("buildPageMetadata");
    expect(notFound).toContain("noIndex: true");
    expect(notFound).toContain("omitCanonical: true");
    expect(notFound).toContain("Page not found");
    expect(notFound).not.toContain("productJsonLd");
    expect(notFound).not.toContain("JsonLdScript");
    expect(notFound).not.toContain("@type\": \"Product");
    expect(notFound).not.toContain("@type\": \"Offer");

    const meta = buildPageMetadata({
      title: "Page not found",
      description: "The page you are looking for does not exist or may have been removed.",
      path: "/",
      noIndex: true,
      omitCanonical: true,
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBeUndefined();
  });

  it("does not redesign homepage stack or invent a second metadata engine", () => {
    const home = readSource("components/homepage/canonical/CanonicalHomepage.tsx");
    const metadata = readSource("lib/seo/metadata.ts");
    expect(home).toContain("CanonicalCategoryRail");
    expect(home).toContain("FeaturedStoreSection");
    expect(home).toContain("CanonicalMarketplaceFeed");
    expect(home).not.toContain("HomepageV4Featured");
    expect(metadata).toContain("export function buildPageMetadata");
    expect(metadata).not.toContain("createSeoMetadataEngine");
    expect(metadata).not.toContain("buildPageMetadataV2");
  });
});
