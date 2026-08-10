/**
 * Bundle Offer sheet — compact UI via canonical Make Offer (Owner visual correction).
 * BundleOfferBridge parallel sheet is removed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — compact Bundle Offer sheet UI", () => {
  it("uses canonical OfferComposerSheet (no parallel 320px BundleOfferBridge)", () => {
    const page = readSource("features/bundle/BundleReviewPage.tsx");
    const css = readSource("styles/rovexo/make-offer-v1.css");

    expect(page).toContain("OfferComposerSheet");
    expect(page).not.toContain("BundleOfferBridge");
    expect(page).not.toContain("minHeight: 320");
    expect(page).not.toContain('data-bundle-offer-sheet="compact"');

    expect(css).toMatch(/\.mo-v1\s*\{[^}]*height:\s*auto/s);
    expect(css).toMatch(/\.mo-v1__amount\s*\{[^}]*height:\s*56px/s);
    expect(css).toMatch(/\.mo-v1\s*\{[^}]*max-width:\s*560px/s);
  });

  it("preserves Submit Offer + POST /api/offers bundle contract", () => {
    const sheet = readSource("features/transaction-hub/OfferComposerSheet.tsx");
    expect(sheet).toContain("Submit Offer");
    expect(sheet).toContain('fetch("/api/offers"');
    expect(sheet).toContain("bundleId: bundle.bundleId");
    expect(sheet).not.toContain("<textarea");
  });

  it("does not shrink shared Add-to-Bundle confirmation sheet height token", () => {
    const css = readSource("styles/rovexo/product-detail-v1.css");
    expect(css).toMatch(/\.pd-v1__bundle-sheet,\s*\n\.pd-v1__bundle-conflict\s*\{[^}]*height:\s*320px/s);
  });
});
