/**
 * Store Shop bundles sticky CTAs — Make Offer + Buy Now (no Review bundle CTA).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Store Shop bundles commerce CTAs", () => {
  const shop = readSource("features/store/components/StoreShopBundles.tsx");
  const css = readSource("styles/rovexo/store-visit-v2.css");

  it("zero / invalid selection: Make Offer + Buy Now stay disabled", () => {
    expect(shop).toContain("hasValidSelection");
    expect(shop).toContain("selectedIds.length >= 2");
    expect(shop).toContain("disabled={!hasValidSelection || submitting || buyBusy}");
  });

  it("valid selection: Review bundle CTA absent · Make Offer + Buy Now present", () => {
    expect(shop).not.toContain("Review bundle");
    expect(shop).not.toContain("sv2__bundle-review-btn");
    expect(shop).not.toContain("reviewBundle");
    expect(shop).toContain('data-bundle-cta="make-offer"');
    expect(shop).toContain('data-bundle-cta="buy-now"');
    expect(shop).toContain('"Make Offer"');
    expect(shop).toContain('"Buy Now"');
    expect(css).toContain(".sv2__bundle-offer-btn");
    expect(css).toContain(".sv2__bundle-buy-btn");
    expect(css).not.toContain(".sv2__bundle-review-btn");
  });

  it("Make Offer uses canonical OfferComposerSheet (no second offer API)", () => {
    expect(shop).toContain("OfferComposerSheet");
    expect(shop).toContain('from "@/features/transaction-hub/OfferComposerSheet"');
    expect(shop).not.toContain("/api/offers/v2");
    expect(shop).not.toContain("createOfferDirect");
  });

  it("Buy Now uses canonical useBuyNowNavigation commerce path", () => {
    expect(shop).toContain("useBuyNowNavigation");
    expect(shop).toContain("executeBuyNow");
    expect(shop).toContain("buildBuyNowCheckoutHref");
    expect(shop).toContain("bundleId:");
    expect(shop).not.toContain("router.push(\"/checkout\")");
  });

  it("syncs via existing Bundle Engine client; review route only for conflict Continue", () => {
    expect(shop).toContain("ensureServerBundle");
    expect(shop).toContain("addLineToBundleClient");
    expect(shop).toContain("BUNDLE_ENGINE_V1.ssot.reviewRoute");
    expect(shop).toContain("handleConflictContinue");
    expect(shop).not.toMatch(/router\.push\(BUNDLE_ENGINE_V1\.ssot\.reviewRoute\);\s*\n\s*\} finally/);
  });

  it("no duplicate CTA implementation files", () => {
    expect(shop).not.toContain("StoreShopBundlesV2");
    expect(shop).not.toContain("BundleReviewCtaDuplicate");
  });
});
