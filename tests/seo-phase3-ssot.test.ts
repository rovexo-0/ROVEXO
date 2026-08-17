import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SEO_SSOT_V1,
  absoluteCanonicalFromPath,
  buildHreflangAlternates,
  buildPageMetadata,
  canonicalForCategory,
  canonicalForHomepage,
  canonicalForListing,
  canonicalForStore,
  evaluateListingSeoEligibility,
  evaluateSeoEligibility,
  hasAlternateHreflangMarkets,
  isSitemapPathEligible,
  popularBrowseLinks,
  productJsonLd,
  relatedCategoryLinks,
  resolveSeoCanonical,
} from "@/lib/seo/ssot";
import { productDetailLinkGroups } from "@/lib/seo/engine/internal-linking";
import { HOMEPAGE_SOCIAL_PREVIEW_V2 } from "@/lib/share/homepage";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import { getAppUrl } from "@/lib/supabase/env";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("SEO Phase 3 — SSOT", () => {
  it("registers existing implementations — no second engines", () => {
    expect(SEO_SSOT_V1.canonical).toContain("resolveSeoCanonical");
    expect(SEO_SSOT_V1.metadata).toContain("buildPageMetadata");
    expect(SEO_SSOT_V1.eligibility).toContain("evaluateSeoEligibility");
    expect(SEO_SSOT_V1.sitemapGate).toContain("eligibility-filter");
    expect(SEO_SSOT_V1.jsonLdListingRuntime).toContain("productJsonLd");

    const filter = readSource("lib/seo/sitemaps/eligibility-filter.ts");
    const metadata = readSource("lib/seo/metadata.ts");
    const jsonLd = readSource("lib/seo/json-ld.ts");
    expect(filter).toContain('from "@/lib/seo/engine/eligibility"');
    expect(filter).not.toContain("evaluateSeoEligibilityV2");
    expect(metadata).toContain("absoluteCanonicalFromPath");
    expect(jsonLd).toContain("absoluteCanonicalFromPath");
    expect(readSource("lib/seo/ssot.ts")).not.toContain("createSeoEligibilityEngine");
    expect(readSource("lib/seo/ssot.ts")).not.toContain("createCanonicalEngine");
  });

  it("canonical SSOT matches existing path helpers and metadata output", () => {
    const origin = getAppUrl().replace(/\/$/, "");
    expect(canonicalForHomepage().canonicalUrl).toBe(`${origin}/`);
    expect(canonicalForListing("nike-air-max").canonicalUrl).toBe(`${origin}/listing/nike-air-max`);
    expect(canonicalForCategory(["womens-fashion", "dresses"]).canonicalUrl).toBe(
      `${origin}/category/womens-fashion/dresses`,
    );
    expect(canonicalForStore("acme").canonicalUrl).toBe(`${origin}/store/acme`);
    expect(resolveSeoCanonical({ path: "/search" }).canonicalUrl).toBe(`${origin}/search`);

    const meta = buildPageMetadata({
      title: "Electronics for Sale UK",
      description: "Shop electronics on ROVEXO.",
      path: "/category/electronics",
    });
    expect(meta.alternates?.canonical).toBe(absoluteCanonicalFromPath("/category/electronics"));
    expect(meta.alternates?.canonical).toBe(canonicalForCategory(["electronics"]).canonicalUrl);
  });

  it("preserves Phase 2 no-canonical behaviour for missing and 404 pages", () => {
    const missing = buildPageMetadata({
      title: STORE_UNAVAILABLE_COPY.title,
      description: STORE_UNAVAILABLE_COPY.body,
      path: "/listing/missing",
      noIndex: true,
      omitCanonical: true,
    });
    expect(missing.alternates?.canonical).toBeUndefined();
    expect(missing.robots).toEqual({ index: false, follow: false });

    const notFound = buildPageMetadata({
      title: "Page not found",
      description: "The page you are looking for does not exist or may have been removed.",
      path: "/",
      noIndex: true,
      omitCanonical: true,
    });
    expect(notFound.alternates?.canonical).toBeUndefined();
  });

  it("preserves metadata for homepage, listing, category, store, and search", () => {
    expect(HOMEPAGE_SOCIAL_PREVIEW_V2.title).toBe("ROVEXO — Buy • Sell • Grow");
    expect(readSource("app/(platform)/page.tsx")).toContain("title: { absolute: HOMEPAGE_OG_TITLE }");

    const listing = buildPageMetadata({
      title: "Nike Air Max · ROVEXO",
      description: "Genuine pair.",
      path: "/listing/nike-air-max",
    });
    expect(listing.title).toEqual({ absolute: "Nike Air Max · ROVEXO" });
    expect(listing.alternates?.canonical).toBe(canonicalForListing("nike-air-max").canonicalUrl);

    const search = buildPageMetadata({
      title: "Search",
      description: "Search ROVEXO.",
      path: "/search",
    });
    expect(search.alternates?.canonical).toBe(absoluteCanonicalFromPath("/search"));
    expect(search.robots).toEqual({ index: true, follow: true });
  });

  it("JSON-LD listing URLs use the canonical SSOT and keep Product/Offer on valid listings", () => {
    const data = productJsonLd(
      {
        id: "1",
        slug: "nike-air-max",
        title: "Nike Air Max",
        description: "Genuine pair.",
        price: 90,
        condition: "new",
        images: ["https://cdn.example/nike.jpg"],
        availability: "in_stock",
        rating: 5,
        reviewCount: 0,
        sellerId: "s1",
        sellerName: "Seller",
      } as never,
      [],
    ) as { "@graph": Array<Record<string, unknown>> };

    const product = data["@graph"].find((node) => node["@type"] === "Product");
    const offer = product?.offers as { url?: string; "@type"?: string } | undefined;
    expect(product).toBeTruthy();
    expect(offer?.["@type"]).toBe("Offer");
    expect(offer?.url).toBe(canonicalForListing("nike-air-max").canonicalUrl);
  });

  it("missing listing and 404 sources do not emit Product/Offer JSON-LD", () => {
    const listing = readSource("app/(platform)/listing/[slug]/page.tsx");
    const pageFn = listing.slice(listing.indexOf("export default"));
    expect(pageFn.indexOf("StoreUnavailablePage")).toBeLessThan(pageFn.indexOf("productJsonLd"));
    expect(listing).not.toContain("notFound(");

    const notFound = readSource("app/not-found.tsx");
    expect(notFound).not.toContain("productJsonLd");
    expect(notFound).not.toContain("JsonLdScript");
  });

  it("eligibility SSOT remains the Phase 1 engine", () => {
    expect(evaluateSeoEligibility({ pageType: "homepage", path: "/" }).indexation).toBe("INDEX");
    expect(
      evaluateListingSeoEligibility({
        slug: "gone",
        productFound: false,
      }).sitemapEligible,
    ).toBe(false);
    expect(isSitemapPathEligible("/resolution")).toBe(false);
    expect(isSitemapPathEligible("/account")).toBe(false);
    expect(isSitemapPathEligible("/listing/run4-cert-listing-demo")).toBe(false);
    expect(
      isSitemapPathEligible("/listing/old-coat", {
        pageType: "product",
        productFound: true,
        productStatus: "deleted",
      }),
    ).toBe(false);
    expect(isSitemapPathEligible("/search")).toBe(true);
  });

  it("internal-linking contract preserves existing URL targets", () => {
    const popular = popularBrowseLinks(3);
    expect(popular.links.every((link) => link.href.startsWith("/category/"))).toBe(true);

    const related = relatedCategoryLinks(["womens-fashion", "dresses"], 3);
    expect(related.links.every((link) => link.href.startsWith("/category/"))).toBe(true);

    const productGroups = productDetailLinkGroups({
      similarProducts: [{ title: "Coat", slug: "coat" } as never],
      sameSellerProducts: [{ title: "Bag", slug: "bag" } as never],
      categoryPath: ["womens-fashion", "dresses"],
    });
    const hrefs = productGroups.flatMap((group) => group.links.map((link) => link.href));
    expect(hrefs).toContain("/listing/coat");
    expect(hrefs).toContain("/listing/bag");
    expect(hrefs).toContain("/category/womens-fashion/dresses");

    const linking = readSource("lib/seo/engine/internal-linking.ts");
    expect(linking).toContain('from "@/lib/seo/internal-links"');
  });

  it("does not invent hreflang or extra locales", () => {
    expect(hasAlternateHreflangMarkets()).toBe(false);
    expect(buildHreflangAlternates("/")).toEqual([]);
    expect(readSource("app/(platform)/page.tsx")).not.toContain("hreflang");
    expect(readSource("app/(platform)/listing/[slug]/page.tsx")).not.toContain("hreflang");
    expect(readSource("app/not-found.tsx")).not.toContain("hreflang");
  });

  it("does not introduce a second metadata or eligibility runtime", () => {
    expect(readSource("lib/seo/metadata.ts")).not.toContain("buildPageMetadataV2");
    expect(readSource("lib/seo/engine/eligibility.ts")).toContain("export function evaluateSeoEligibility");
    expect(readSource("lib/seo/sitemaps/eligibility-filter.ts")).toContain("evaluateSeoEligibility");
    expect(readSource("components/homepage/canonical/CanonicalHomepage.tsx")).toContain(
      'data-hp-h1="phase-2"',
    );
    expect((readSource("components/homepage/canonical/CanonicalHomepage.tsx").match(/<h1\b/g) ?? []).length).toBe(
      1,
    );
  });
});
