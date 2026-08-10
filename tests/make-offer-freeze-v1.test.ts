import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  MAKE_OFFER_FREEZE_V1,
  calculateOfferFromDiscount,
  formatOfferAmount,
  parseOfferAmount,
  sanitizeOfferInput,
} from "@/lib/transaction-hub/make-offer-freeze-v1";

describe("Make Offer Cod Sânge v1.0 FINAL FREEZE", () => {
  it("locks stack and removed chrome", () => {
    expect(MAKE_OFFER_FREEZE_V1.status).toBe("FINAL_FREEZE");
    expect(MAKE_OFFER_FREEZE_V1.freezeLocked).toBe(true);
    expect(MAKE_OFFER_FREEZE_V1.stack).toEqual([
      "Close",
      "Product image",
      "Product title",
      "£XX.XX",
      "5% OFF",
      "10% OFF",
      "CUSTOM",
      "£0.00",
      "Submit Offer",
    ]);
    expect(MAKE_OFFER_FREEZE_V1.showOfferQuotaSubtext).toBe(false);
    expect(MAKE_OFFER_FREEZE_V1.removedForever).toContain("Make Offer title");
    expect(MAKE_OFFER_FREEZE_V1.removedForever).toContain("Message (optional)");
    expect(MAKE_OFFER_FREEZE_V1.removedForever).toContain("Cancel button");
    expect(MAKE_OFFER_FREEZE_V1.removedForever).toContain("offers left for today");
  });

  it("calculates 5% and 10% from listing price", () => {
    expect(calculateOfferFromDiscount(100, 0.05)).toBe(95);
    expect(calculateOfferFromDiscount(100, 0.1)).toBe(90);
    expect(calculateOfferFromDiscount(8, 0.05)).toBe(7.6);
    expect(calculateOfferFromDiscount(8, 0.1)).toBe(7.2);
    expect(formatOfferAmount(7.6)).toBe("£7.60");
  });

  it("sanitizes custom input — numeric decimal only", () => {
    expect(sanitizeOfferInput("£87.50abc")).toBe("87.50");
    expect(sanitizeOfferInput("12.345")).toBe("12.34");
    expect(sanitizeOfferInput("-5")).toBe("5");
    expect(parseOfferAmount("0")).toBeNull();
    expect(parseOfferAmount("0.00")).toBeNull();
    expect(parseOfferAmount("1.00")).toBe(1);
    expect(parseOfferAmount("87")).toBe(87);
  });

  it("composer UI matches freeze — no message, no cancel, purple presets", () => {
    const sheet = readFileSync(
      path.join(process.cwd(), "features/transaction-hub/OfferComposerSheet.tsx"),
      "utf8",
    );
    const css = readFileSync(path.join(process.cwd(), "styles/rovexo/make-offer-v1.css"), "utf8");
    const index = readFileSync(path.join(process.cwd(), "styles/rovexo/index.css"), "utf8");

    expect(sheet).toContain('data-make-offer-freeze="FINAL_FREEZE"');
    expect(sheet).toContain("SafeImage");
    expect(sheet).toContain("5% off");
    expect(sheet).toContain("10% off");
    expect(sheet).toContain("Custom");
    expect(sheet).toContain("Submit Offer");
    expect(sheet).not.toContain("offers left for today");
    expect(sheet).not.toContain("mo-v1__limit");
    expect(sheet).toContain('inputMode="decimal"');
    expect(sheet).not.toContain("Message");
    expect(sheet).not.toContain("Cancel");
    expect(sheet).not.toContain("Your offer");
    expect(sheet).not.toContain("Item price");
    expect(sheet).not.toContain("Listing price");
    expect(sheet).not.toContain("Buyer Protection");
    expect(sheet).not.toContain("Learn why");
    expect(css).toContain("#9333ea");
    expect(css).toContain("linear-gradient(135deg, #a855f7");
    expect(css).not.toContain("#14b8a6");
    expect(css).not.toContain("teal");
    expect(sheet).toContain('import "@/styles/rovexo/make-offer-v1.css"');
    expect(index).not.toContain("./make-offer-v1.css");
  });
});
