/**
 * Fluid CPU P0/P1 — source contracts only.
 * Does not change Demand math, Auth architecture, Inbox, Browse, or Saved.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("P0-1 instrumentation / expireAll", () => {
  it("does not run expireAll on Node isolate startup", () => {
    const instrumentation = read("instrumentation.ts");
    expect(instrumentation).not.toContain("CHECKOUT_SESSION_ENGINE_expireAll");
    expect(instrumentation).not.toContain("startup expireAll");
  });

  it("keeps expireAll as the single canonical engine", () => {
    const engine = read("lib/checkout/engines/checkout-session-engine-v1.ts");
    expect(engine).toContain("export async function CHECKOUT_SESSION_ENGINE_expireAll");
    expect(engine).toContain("expireAllInFlight");
    expect(engine).toContain("healOrphanedReservations");
    expect(engine).toContain("CHECKOUT_SESSION_ENGINE_selfHeal");
    expect(existsSync(path.join(ROOT, "lib/checkout/engines/checkout-session-engine-v2.ts"))).toBe(
      false,
    );
  });

  it("reuses AUTO_CANCEL / orders cleanup for maintenance expireAll", () => {
    expect(read("lib/orders/cleanup.ts")).toContain("AUTO_CANCEL_ENGINE_run");
    expect(read("lib/checkout/engines/auto-cancel-engine-v1.ts")).toContain(
      "CHECKOUT_SESSION_ENGINE_expireAll",
    );
    expect(read("lib/cron/maintenance.ts")).toContain("cleanupExpiredOrders");
  });

  it("listing self-heal stays present but is non-blocking", () => {
    const listing = read("app/(platform)/listing/[slug]/page.tsx");
    expect(listing).toContain('awaitCheckoutSessionSelfHeal("listing-view")');
    const heal = read("lib/checkout/checkout-session-self-heal-server-v1.ts");
    expect(heal).toContain('NON_BLOCKING_SELF_HEAL_REASONS');
    expect(heal).toContain('"listing-view"');
    expect(heal).toContain("return;");
    expect(read("lib/checkout/engines/buy-now-engine-v1.ts")).toContain(
      "CHECKOUT_SESSION_ENGINE_expireAll",
    );
  });
});

describe("P0-2 / P0-3 category cache", () => {
  it("loadAllCategories and resolveCategoryPage use React cache", () => {
    const server = read("lib/categories/server.ts");
    expect(server).toContain('import { cache } from "react"');
    expect(server).toContain("export const loadAllCategories = cache");
    expect(server).toContain("resolveCategoryPageCached(slugs.join(\"/\")");
    expect(server).toContain("getDescendantCategoryIdsCached");
  });

  it("category metadata still uses pageSize 1 and page uses pageSize 24", () => {
    const page = read("app/(platform)/category/[...slug]/page.tsx");
    expect(page).toContain("pageSize: 1");
    expect(page).toContain("pageSize: 24");
    expect(page).toContain("resolveDemandBadgeLabels");
    expect(page).toContain("resolveCategoryPage");
  });
});

describe("P0-4 searchListings cost", () => {
  it("keeps exact count, promotions refresh, rating, and transaction modes", () => {
    const repo = read("lib/listings/repository.ts");
    expect(repo).toContain("await refreshExpiredPromotions()");
    expect(repo).toContain('{ count: "exact" }');
    expect(repo).toContain("attachTransactionModes");
    expect(repo).toContain("enrichProductsWithCanonicalSellerRating");
    expect(read("lib/promotions/service.ts")).toContain("PROMOTION_REFRESH_MIN_INTERVAL_MS");
    expect(read("lib/transaction-mode/server.ts")).toContain("loadAllCategories");
  });
});

describe("P1 sitemap / listing / middleware", () => {
  it("caches sitemap index and child sitemap generation", () => {
    expect(read("app/api/seo/sitemap-index/route.ts")).toContain("export const revalidate = 3600");
    expect(read("app/api/seo/sitemap-index/route.ts")).not.toContain("force-dynamic");
    expect(read("app/sitemap.ts")).toContain("export const revalidate = 3600");
    expect(read("app/robots.ts")).toContain("/sitemap.xml");
    expect(read("app/robots.ts")).toContain("/sitemap/products.xml");
  });

  it("keeps listing force-dynamic and does not change Listing Detail UI wiring", () => {
    const listing = read("app/(platform)/listing/[slug]/page.tsx");
    expect(listing).toContain('export const dynamic = "force-dynamic"');
    expect(listing).toContain("ProductDetailPage");
    expect(listing).toContain("resolveListingDemand");
  });

  it("skips SEO DB for sitemap/robots and skips session work on public GET", () => {
    const seo = read("lib/seo/engine/middleware-handler.ts");
    expect(seo).toContain('"sitemap"');
    expect(seo).toContain('"robots.txt"');
    const mw = read("lib/supabase/middleware.ts");
    expect(mw).toContain("Public catalogue GET");
    expect(mw).toContain("!isProtectedEarly");
    expect(mw).toContain("enforceApiPerimeterSecurity");
    expect(mw).toContain("AUTH_PROTECTED_PREFIXES");
  });
});
