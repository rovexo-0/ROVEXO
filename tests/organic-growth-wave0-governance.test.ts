import { describe, expect, it } from "vitest";
import {
  evaluateSeoEligibility,
  evaluateListingSeoEligibility,
} from "@/lib/seo/engine/eligibility";
import {
  evaluateSeoProtection,
  isSeoIndexExcludedPath,
} from "@/lib/seo/engine/protection";
import {
  canonicalForBrand,
  canonicalForCategory,
  canonicalForHomepage,
  canonicalForListing,
  canonicalForLocation,
  canonicalForSeller,
  canonicalForStore,
  resolveSeoCanonical,
} from "@/lib/seo/engine/canonical";
import {
  resolveLifecyclePolicy,
  resolveListingLifecycle,
  SEO_LIFECYCLE_POLICIES,
} from "@/lib/seo/engine/lifecycle";
import { getAppUrl } from "@/lib/supabase/env";

const site = () => getAppUrl().replace(/\/$/, "");

describe("Wave 0 — SEO Eligibility Orchestrator", () => {
  it("active valid listing → eligible INDEX", () => {
    const result = evaluateListingSeoEligibility({
      slug: "nike-air-max",
      productFound: true,
      status: "published",
    });
    expect(result.eligible).toBe(true);
    expect(result.indexation).toBe("INDEX");
    expect(result.sitemapEligible).toBe(true);
    expect(result.structuredDataEligible).toBe(true);
    expect(result.canonical.canonicalPath).toBe("/listing/nike-air-max");
  });

  it("unavailable / missing listing → protected NOINDEX (soft-200 policy)", () => {
    const result = evaluateListingSeoEligibility({
      slug: "gone",
      productFound: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.indexation).toBe("NOINDEX");
    expect(result.sitemapEligible).toBe(false);
    expect(result.structuredDataEligible).toBe(false);
  });

  it("private route → EXCLUDE", () => {
    for (const path of ["/account", "/wallet", "/orders", "/inbox", "/sell", "/admin", "/super-admin"]) {
      const result = evaluateSeoEligibility({ pageType: "private", path });
      expect(result.eligible).toBe(false);
      expect(result.indexation).toBe("EXCLUDE");
      expect(result.sitemapEligible).toBe(false);
    }
  });

  it("duplicate risk → protected NOINDEX", () => {
    const result = evaluateSeoEligibility({
      pageType: "browse",
      path: "/browse/women",
      listingCount: 20,
      qualityScore: 80,
      duplicateRisk: 0.9,
    });
    expect(result.eligible).toBe(false);
    expect(result.indexation).toBe("NOINDEX");
  });

  it("empty facet / zero inventory → protected", () => {
    const result = evaluateSeoEligibility({
      pageType: "browse",
      path: "/browse/empty",
      listingCount: 0,
      qualityScore: 80,
    });
    expect(result.eligible).toBe(false);
    expect(result.indexation).toBe("NOINDEX");
  });

  it("invalid taxonomy → protected", () => {
    const result = evaluateSeoEligibility({
      pageType: "category",
      path: "/category/not-real",
      listingCount: 10,
      qualityScore: 80,
      taxonomyValid: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.indexation).toBe("NOINDEX");
  });

  it("valid category with inventory → eligible", () => {
    const result = evaluateSeoEligibility({
      pageType: "category",
      path: "/category/womens-fashion",
      listingCount: 12,
      qualityScore: 70,
      taxonomyValid: true,
    });
    expect(result.eligible).toBe(true);
    expect(result.indexation).toBe("INDEX");
    expect(result.sitemapEligible).toBe(true);
  });

  it("valid brand with inventory → eligible", () => {
    const result = evaluateSeoEligibility({
      pageType: "brand",
      path: "/brand/nike",
      listingCount: 5,
      qualityScore: 70,
    });
    expect(result.eligible).toBe(true);
    expect(result.indexation).toBe("INDEX");
  });

  it("valid store with inventory → eligible", () => {
    const result = evaluateSeoEligibility({
      pageType: "store",
      path: "/store/acme",
      listingCount: 3,
      qualityScore: 60,
    });
    expect(result.eligible).toBe(true);
    expect(result.indexation).toBe("INDEX");
  });

  it("homepage → eligible without inventory count", () => {
    const result = evaluateSeoEligibility({
      pageType: "homepage",
      path: "/",
    });
    expect(result.eligible).toBe(true);
    expect(result.indexation).toBe("INDEX");
    expect(result.canonical.canonicalUrl).toBe(`${site()}/`);
  });

  it("search results query → NOINDEX", () => {
    const result = evaluateSeoEligibility({
      pageType: "search",
      path: "/search",
      hasSearchQuery: true,
      searchParams: { q: "nike" },
    });
    expect(result.eligible).toBe(false);
    expect(result.indexation).toBe("NOINDEX");
  });
});

describe("Wave 0 — Canonical Engine", () => {
  it("root canonical is absolute trailing-slash production URL", () => {
    const root = canonicalForHomepage();
    expect(root.valid).toBe(true);
    expect(root.canonicalUrl).toBe(`${site()}/`);
    expect(root.canonicalPath).toBe("/");
  });

  it("category / product-type / brand / listing / store / seller / location", () => {
    expect(canonicalForCategory(["womens-fashion", "dresses"]).canonicalPath).toBe(
      "/category/womens-fashion/dresses",
    );
    expect(canonicalForBrand("nike").canonicalPath).toBe("/brand/nike");
    expect(canonicalForListing("item-1").canonicalPath).toBe("/listing/item-1");
    expect(canonicalForStore("acme").canonicalPath).toBe("/store/acme");
    expect(canonicalForSeller("jane").canonicalPath).toBe("/user/jane");
    expect(canonicalForLocation("london", ["electronics"]).canonicalPath).toBe(
      "/l/london/electronics",
    );
  });

  it("strips tracking and query parameters from canonical", () => {
    const result = resolveSeoCanonical({
      path: "/listing/item-1",
      searchParams: {
        utm_source: "google",
        gclid: "abc",
        fbclid: "x",
        color: "red",
      },
    });
    expect(result.canonicalUrl).toBe(`${site()}/listing/item-1`);
    expect(result.strippedParams).toEqual(
      expect.arrayContaining(["utm_source", "gclid", "fbclid", "color"]),
    );
  });

  it("rejects login as canonical target", () => {
    const result = resolveSeoCanonical({ path: "/login" });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("login");
  });

  it("deduplicates trailing slashes on non-root paths", () => {
    expect(resolveSeoCanonical({ path: "/brand/nike/" }).canonicalPath).toBe("/brand/nike");
  });
});

describe("Wave 0 — Indexation Lifecycle", () => {
  it("ACTIVE → INDEX", () => {
    const p = resolveLifecyclePolicy("ACTIVE");
    expect(p.indexation).toBe("INDEX");
    expect(p.sitemapEligible).toBe(true);
    expect(p.policyVerified).toBe(true);
  });

  it("SOLD → KEEP INDEXED + OutOfStock", () => {
    const p = resolveListingLifecycle({ productFound: true, status: "sold" });
    expect(p.state).toBe("SOLD");
    expect(p.indexation).toBe("INDEX");
    expect(p.offerAvailability).toBe("OutOfStock");
    expect(p.sitemapEligible).toBe(true);
    expect(SEO_LIFECYCLE_POLICIES.SOLD.indexation).toBe("INDEX");
  });

  it("EXPIRED → NOT_VERIFIED (no invented 410)", () => {
    const p = resolveLifecyclePolicy("EXPIRED");
    expect(p.indexation).toBe("NOT_VERIFIED");
    expect(p.policyVerified).toBe(false);
    expect(p.httpStatus).toBeNull();
  });

  it("DELETED / UNAVAILABLE / NOT_FOUND → NOINDEX soft-200", () => {
    for (const state of ["DELETED", "UNAVAILABLE", "NOT_FOUND"] as const) {
      const p = resolveLifecyclePolicy(state);
      expect(p.indexation).toBe("NOINDEX");
      expect(p.softUnavailable).toBe(true);
      expect(p.httpStatus).toBe(200);
      expect(p.sitemapEligible).toBe(false);
      expect(p.structuredDataEligible).toBe(false);
    }
  });

  it("eligibility for EXPIRED lifecycle does not invent 410", () => {
    const result = evaluateSeoEligibility({
      pageType: "product",
      path: "/listing/old",
      lifecycle: "EXPIRED",
      productFound: true,
    });
    expect(result.indexation).toBe("NOT_VERIFIED");
    expect(result.eligible).toBe(false);
  });
});

describe("Wave 0 — Protection / Anti-Bloat", () => {
  it("blocks private, API, auth, search results, facet explosions, thin pages", () => {
    expect(evaluateSeoProtection({ path: "/wallet" }).verdict).toBe("BLOCK_EXCLUDE");
    expect(evaluateSeoProtection({ path: "/api/orders" }).verdict).toBe("BLOCK_EXCLUDE");
    expect(evaluateSeoProtection({ path: "/login" }).verdict).toBe("BLOCK_NOINDEX");
    expect(
      evaluateSeoProtection({ path: "/search", hasSearchQuery: true }).verdict,
    ).toBe("BLOCK_NOINDEX");
    expect(
      evaluateSeoProtection({
        path: "/browse/x",
        searchParams: new URLSearchParams("brand=a&condition=b&minPrice=1"),
      }).verdict,
    ).toBe("BLOCK_NOINDEX");
    expect(evaluateSeoProtection({ path: "/brand/x", listingCount: 0 }).verdict).toBe(
      "BLOCK_NOINDEX",
    );
    expect(evaluateSeoProtection({ path: "/brand/x", listingCount: 1 }).verdict).toBe(
      "BLOCK_NOINDEX",
    );
    expect(isSeoIndexExcludedPath("/checkout")).toBe(true);
    expect(isSeoIndexExcludedPath("/messages")).toBe(true);
    expect(isSeoIndexExcludedPath("/notifications")).toBe(true);
  });

  it("allows healthy public hubs", () => {
    expect(
      evaluateSeoProtection({ path: "/category/electronics", listingCount: 10 }).allowed,
    ).toBe(true);
    expect(evaluateSeoProtection({ path: "/" }).allowed).toBe(true);
  });
});
