import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SELL_PAGE_CANONICAL_VERSION } from "@/features/sell/ui/SellScreen";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell page canonical v1.0", () => {
  it("exports frozen canonical version marker", () => {
    expect(SELL_PAGE_CANONICAL_VERSION).toBe("v1.0-canonical");
  });

  it("has one canonical sell screen with correct block order", () => {
    const screen = readSource("features/sell/ui/SellScreen.tsx");
    expect(screen).toContain('data-sell-canonical={SELL_PAGE_CANONICAL_VERSION}');
    expect(screen).toContain("SellPhotoRail");
    expect(screen).toContain("SellTitleBlock");
    expect(screen).toContain("SellDescriptionBlock");
    expect(screen).toContain("SellCategoryBlock");
    expect(screen).toContain("SellAttributesBlock");
    expect(screen).toContain("SellPricingBlock");
    expect(screen).toContain("SellParcelBlock");
    expect(screen).toContain("SellPublishBar");
    expect(screen).not.toContain("SellShippingBlock");
    expect(screen).not.toContain("SellOptionsBlock");
    expect(screen).not.toContain("SellSuccessScreen");
  });

  it("category picker has suggestions only — no search", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    expect(picker).toContain("detectCategoryFromTitle");
    expect(picker).toContain("Suggested");
    expect(picker).not.toContain("Search categories");
    expect(picker).not.toContain("searchCategoryPicker");
  });

  it("photo rail has only Add Photos — no Take Photo button", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("Add Photos");
    expect(rail).not.toContain("Take Photo");
    expect(rail).not.toContain('intent="camera"');
  });

  it("attribute pickers auto-close — no Done button", () => {
    const picker = readSource("features/sell/ui/SellOptionPicker.tsx");
    expect(picker).not.toContain(">Done</");
    expect(picker).toContain("onClose()");
    expect(picker).toContain("overflow-y-auto");
  });

  it("parcel block only — no shipping toggles", () => {
    const parcel = readSource("features/sell/ui/SellParcelBlock.tsx");
    expect(parcel).toContain("Parcel size");
    expect(parcel).not.toContain("Home delivery");
    expect(parcel).not.toContain("Collection");
    expect(parcel).not.toContain("SellToggle");
  });

  it("deterministic prefill wired in provider", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("buildDeterministicPrefill");
    expect(provider).toContain("detectColourFromImageFile");
    expect(provider).not.toContain('setView("published")');
  });

  it("publish bar is fixed at bottom", () => {
    const bar = readSource("features/sell/ui/SellPublishBar.tsx");
    expect(bar).toContain("Publish Listing");
    expect(bar).toContain("sell-publish-bar fixed");
  });

  it("removed legacy duplicate sell components", () => {
    const legacyPaths = [
      "features/sell/components/PhotoUploader.tsx",
      "features/sell/components/CategoryTreePicker.tsx",
      "features/sell/ui/SellShippingBlock.tsx",
    ];
    for (const legacyPath of legacyPaths) {
      expect(() => readSource(legacyPath)).toThrow();
    }
  });
});
