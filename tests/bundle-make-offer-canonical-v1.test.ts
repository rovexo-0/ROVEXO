/**
 * Bundle Make Offer — reuses canonical OfferComposerSheet (5% / 10% / Custom).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculateOfferFromDiscount,
  formatOfferAmount,
} from "@/lib/transaction-hub/make-offer-freeze-v1";
import { PRODUCT_PAGE_CANONICAL_FREEZE_V1 } from "@/lib/product-detail/product-page-canonical-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — Bundle Make Offer → canonical Make Offer UI", () => {
  it("calculates 5% and 10% from bundle list total £76 (not per line)", () => {
    const total = 76;
    expect(calculateOfferFromDiscount(total, 0.05)).toBe(72.2);
    expect(calculateOfferFromDiscount(total, 0.1)).toBe(68.4);
    expect(formatOfferAmount(72.2)).toBe("£72.20");
    expect(formatOfferAmount(68.4)).toBe("£68.40");
  });

  it("Review Bundle opens OfferComposerSheet with bundle context", () => {
    const review = readSource("features/bundle/BundleReviewPage.tsx");
    expect(review).toContain("OfferComposerSheet");
    expect(review).toContain("bundle={offerBundleContext}");
    expect(review).toContain("product={offerProduct}");
    expect(review).not.toContain("BundleOfferBridge");
    expect(review).not.toContain("Your offer (£)");
    expect(review).not.toContain("pd-v1__bundle-sheet--offer");
    expect(review).not.toContain("minHeight: 320");
  });

  it("OfferComposerSheet keeps 5% / 10% / Custom and POST /api/offers", () => {
    const sheet = readSource("features/transaction-hub/OfferComposerSheet.tsx");
    expect(sheet).toContain("5% off");
    expect(sheet).toContain("10% off");
    expect(sheet).toContain("Set a price");
    expect(sheet).toContain("Custom");
    expect(sheet).toContain("Submit Offer");
    expect(sheet).toContain('fetch("/api/offers"');
    expect(sheet).toContain("bundle:");
    expect(sheet).toContain("bundleId: bundle.bundleId");
    expect(sheet).toContain("productSlug: product.slug");
    expect(sheet).toContain("calculateOfferFromDiscount");
    expect(sheet).not.toContain("/api/bundle-offers");
    expect(sheet).not.toContain("/api/offers/bundle");
  });

  it("mobile compact sheet — height auto, no forced 320px, input 56px", () => {
    const css = readSource("styles/rovexo/make-offer-v1.css");
    expect(css).toMatch(/\.mo-v1\s*\{[^}]*height:\s*auto/s);
    expect(css).toMatch(/\.mo-v1\s*\{[^}]*max-height:\s*90dvh/s);
    expect(css).toMatch(/\.mo-v1\s*\{[^}]*max-width:\s*560px/s);
    expect(css).toMatch(/\.mo-v1__amount\s*\{[^}]*height:\s*56px/s);
    expect(css).toMatch(/\.mo-v1__amount\s*\{[^}]*min-height:\s*56px/s);
    expect(css).toMatch(/\.mo-v1__amount\s*\{[^}]*max-height:\s*64px/s);
    expect(css).toMatch(/\.mo-v1__input\s*\{[^}]*font-size:\s*16px/s);
    expect(css).not.toMatch(/\.mo-v1\s*\{[^}]*height:\s*320px/s);
    expect(css).toContain("filter: none");
  });

  it("PDP Add to Bundle remains removed", () => {
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToBundle).toBe(false);
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
    expect(page).not.toContain("onAddToBundle");
    expect(page).not.toContain("handleAddToBundle");
    expect(bar).not.toContain("Add to Bundle");
    expect(bar).not.toContain("onAddToBundle");
  });

  it("Wave C offer thumbnails remain intact", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain('data-offer-product-thumb="true"');
    expect(hub).toContain("SafeImage");
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/BundleOfferDetailsSheet.tsx")),
    ).toBe(false);
  });

  it("listing Make Offer path still uses productSlug without requiring bundle", () => {
    const sheet = readSource("features/transaction-hub/OfferComposerSheet.tsx");
    const pdp = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(pdp).toContain("OfferComposerSheet");
    expect(pdp).not.toContain("bundle={");
    expect(sheet).toContain("productSlug: product.slug");
    expect(sheet).toContain("bundle?");
  });
});
