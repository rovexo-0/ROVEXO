/**
 * Owner: Make Offer must not render offer-quota / "offers left" subtext.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAKE_OFFER_FREEZE_V1 } from "@/lib/transaction-hub/make-offer-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — Make Offer quota subtext removed", () => {
  it("does not render offers left for today (listing + bundle share OfferComposerSheet)", () => {
    const sheet = readSource("features/transaction-hub/OfferComposerSheet.tsx");
    const css = readSource("styles/rovexo/make-offer-v1.css");
    const review = readSource("features/bundle/BundleReviewPage.tsx");

    expect(sheet).not.toContain("offers left for today");
    expect(sheet).not.toContain("offers remaining");
    expect(sheet).not.toContain("left for today");
    expect(sheet).not.toContain("mo-v1__limit");
    expect(sheet).not.toContain("dailyOfferLimit");
    expect(sheet).toContain("Submit Offer");
    expect(sheet).toContain("5% off");
    expect(sheet).toContain("10% off");
    expect(sheet).toContain("Set a price");

    expect(css).not.toContain(".mo-v1__limit");

    expect(review).toContain("OfferComposerSheet");
    expect(review).not.toContain("offers left");

    expect(MAKE_OFFER_FREEZE_V1.showOfferQuotaSubtext).toBe(false);
    expect(MAKE_OFFER_FREEZE_V1.stack).not.toContain("XX offers left for today");
    expect(MAKE_OFFER_FREEZE_V1.removedForever).toContain("offers left for today");
  });
});
