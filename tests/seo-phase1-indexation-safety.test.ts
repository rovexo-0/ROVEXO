import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateListingSeoEligibility, evaluateSeoEligibility } from "@/lib/seo/engine/eligibility";
import { sitemapIndexUrls } from "@/lib/seo/audit";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import {
  buildBlogSitemapEntries,
  buildBrowseComboSitemapEntries,
  buildCategorySitemapEntries,
  buildCollectionsSitemapEntries,
  buildDiscoverSitemapEntries,
  buildLocationSitemapEntries,
  buildStaticSitemapEntries,
  buildTrendsSitemapEntries,
} from "@/lib/seo/sitemaps/generators";
import {
  filterSitemapEntries,
  isBlockedByExistingRobotsPolicy,
  isSitemapPathEligible,
  pathFromSitemapUrl,
} from "@/lib/seo/sitemaps/eligibility-filter";
import { getAppUrl } from "@/lib/supabase/env";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const site = () => getAppUrl().replace(/\/$/, "");

describe("SEO Phase 1 — Indexation Safety", () => {
  it("reuses Wave 0 evaluateSeoEligibility — no second engine", () => {
    const filter = readSource("lib/seo/sitemaps/eligibility-filter.ts");
    const generators = readSource("lib/seo/sitemaps/generators.ts");
    expect(filter).toContain('from "@/lib/seo/engine/eligibility"');
    expect(filter).toContain("evaluateSeoEligibility");
    expect(filter).toContain("evaluateListingSeoEligibility");
    expect(generators).toContain('from "@/lib/seo/sitemaps/eligibility-filter"');
    expect(generators).toContain("filterSitemapEntries");
    expect(generators).not.toContain("evaluateSeoEligibilityV2");
    expect(filter).not.toContain("createSeoEligibilityEngine");
  });

  it("excludes disallowed /resolution from the static sitemap", () => {
    const urls = buildStaticSitemapEntries().map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/resolution"))).toBe(false);
    expect(isSitemapPathEligible("/resolution")).toBe(false);
    expect(isBlockedByExistingRobotsPolicy("/resolution")).toBe(true);
    expect(
      evaluateSeoEligibility({ pageType: "private", path: "/resolution" }).sitemapEligible,
    ).toBe(false);
  });

  it("excludes noindex / auth-public URLs from sitemap emission", () => {
    expect(isSitemapPathEligible("/login")).toBe(false);
    expect(isSitemapPathEligible("/register")).toBe(false);
    const leaked = filterSitemapEntries([
      { url: `${site()}/login` },
      { url: `${site()}/search` },
    ]);
    expect(leaked.map((entry) => pathFromSitemapUrl(entry.url))).toEqual(["/search"]);
  });

  it("excludes private authenticated URLs", () => {
    for (const path of [
      "/account",
      "/wallet",
      "/orders",
      "/inbox",
      "/messages",
      "/checkout",
      "/cart",
      "/admin",
      "/super-admin",
    ]) {
      expect(isSitemapPathEligible(path)).toBe(false);
      expect(isBlockedByExistingRobotsPolicy(path)).toBe(true);
    }
  });

  it("excludes prohibited / non-public listing slugs when existing rules say so", () => {
    expect(isForbiddenMarketplaceSlug("run4-cert-listing-demo")).toBe(true);
    expect(isSitemapPathEligible("/listing/run4-cert-listing-demo")).toBe(false);
    expect(
      filterSitemapEntries([{ url: `${site()}/listing/run4-cert-listing-demo` }]),
    ).toEqual([]);
  });

  it("excludes deleted / unavailable listings from sitemap", () => {
    const deleted = evaluateListingSeoEligibility({
      slug: "old-coat",
      productFound: true,
      status: "deleted",
    });
    expect(deleted.sitemapEligible).toBe(false);
    expect(
      isSitemapPathEligible("/listing/old-coat", {
        pageType: "product",
        productFound: true,
        productStatus: "deleted",
      }),
    ).toBe(false);

    const missing = evaluateListingSeoEligibility({
      slug: "gone",
      productFound: false,
    });
    expect(missing.sitemapEligible).toBe(false);
    expect(
      isSitemapPathEligible("/listing/gone", {
        pageType: "product",
        productFound: false,
        softUnavailable: true,
      }),
    ).toBe(false);
  });

  it("keeps eligible public URLs in the sitemap", () => {
    const urls = buildStaticSitemapEntries().map((entry) => entry.url);
    expect(urls.some((url) => url === getAppUrl() || url === `${site()}` || url === `${site()}/`)).toBe(
      true,
    );
    expect(urls).toContain(`${site()}/search`);
    expect(urls).toContain(`${site()}/categories`);
    expect(isSitemapPathEligible("/")).toBe(true);
    expect(isSitemapPathEligible("/search")).toBe(true);
    expect(
      isSitemapPathEligible("/listing/nike-air-max", {
        pageType: "product",
        productFound: true,
        productStatus: "published",
      }),
    ).toBe(true);
  });

  it("keeps existing sitemap shards working", () => {
    const shards = sitemapIndexUrls();
    expect(shards).toHaveLength(12);
    expect(buildStaticSitemapEntries().length).toBeGreaterThan(5);
    expect(buildCategorySitemapEntries().length).toBeGreaterThan(0);
    expect(buildLocationSitemapEntries().length).toBeGreaterThan(0);
    expect(buildDiscoverSitemapEntries().length).toBeGreaterThan(0);
    expect(buildCollectionsSitemapEntries().length).toBeGreaterThan(0);
    expect(buildBlogSitemapEntries().length).toBeGreaterThan(0);
    expect(buildTrendsSitemapEntries().length).toBeGreaterThanOrEqual(0);
    expect(buildBrowseComboSitemapEntries().length).toBeGreaterThanOrEqual(0);
  });

  it("fails closed when eligibility data is unavailable — does not throw", () => {
    expect(() => isSitemapPathEligible("")).not.toThrow();
    expect(() => filterSitemapEntries([{ url: "" }])).not.toThrow();
    expect(filterSitemapEntries([{ url: "" }])).toEqual([]);
    expect(
      isSitemapPathEligible("/listing/x", {
        pageType: "product",
        productFound: false,
      }),
    ).toBe(false);
  });

  it("does not introduce duplicate URLs inside a shard", () => {
    const staticUrls = buildStaticSitemapEntries().map((entry) => entry.url);
    expect(new Set(staticUrls).size).toBe(staticUrls.length);

    const categoryUrls = buildCategorySitemapEntries().map((entry) => entry.url);
    expect(new Set(categoryUrls).size).toBe(categoryUrls.length);

    const duped = filterSitemapEntries([
      { url: `${site()}/search` },
      { url: `${site()}/search` },
      { url: `${site()}/categories` },
    ]);
    expect(duped).toHaveLength(2);
  });

  it("excludes empty/thin hubs when existing eligibility already has listingCount", () => {
    expect(
      isSitemapPathEligible("/category/womens-fashion", {
        pageType: "category",
        listingCount: 0,
      }),
    ).toBe(false);
    expect(
      isSitemapPathEligible("/browse/empty", {
        pageType: "browse",
        listingCount: 1,
      }),
    ).toBe(false);
    expect(
      isSitemapPathEligible("/category/womens-fashion", {
        pageType: "category",
        listingCount: 12,
      }),
    ).toBe(true);
  });

  it("does not change robots.ts policy", () => {
    const robots = readSource("app/robots.ts");
    expect(robots).toContain("AUTH_PROTECTED_PREFIXES");
    expect(robots).toContain("protectedPathDisallows");
    expect(robots).toContain("disallow");
    expect(readSource("lib/auth/protected-routes.ts")).toContain('"/resolution"');
  });
});
