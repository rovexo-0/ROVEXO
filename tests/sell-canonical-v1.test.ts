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

    expect(screen).toContain("SellProgressiveAttributes");

    expect(screen).toContain("SellConditionBlock");

    expect(screen).toContain("SellParcelBlock");

    expect(screen).toContain("SellPricingBlock");

    expect(screen).toContain("AccountCanonicalHeader");

    expect(screen).toContain("SellPublishBar");

    expect(screen).toContain("DraftRecoveryDialog");

    expect(screen).toContain("PublishSuccessDialog");
    expect(screen).toContain("publishSuccess");

    expect(screen).toContain("PublishingOverlay");

    expect(screen).not.toContain('centeredTitle="Sell an item"');

    expect(screen).toContain("freshSession");

    expect(screen).not.toContain("SellReviewBlock");

    expect(screen).not.toContain("SellShippingBlock");

    expect(screen).not.toContain("SellOptionsBlock");

    expect(screen).not.toContain("SellSuccessScreen");

    expect(screen).not.toContain("showPublishBar");

    expect(screen.indexOf("<SellCategoryBlock")).toBeLessThan(screen.indexOf("<SellDescriptionBlock"));

    expect(screen.indexOf("<SellParcelBlock")).toBeLessThan(screen.indexOf("<SellPricingBlock"));

  });



  it("category picker has suggestions only — no search", () => {

    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");

    expect(picker).toContain("detectCategoryFromTitle");

    expect(picker).toContain("Choose another category");

    expect(picker).not.toContain("Search categories");

    expect(picker).not.toContain("searchCategoryPicker");

  });



  it("category block auto-selects high-confidence matches", () => {

    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");

    expect(block).not.toContain("shouldAutoSelectCategory");

    expect(block).toContain("buildCategoryDetectionText");

  });



  it("pricing block is price-only — no seller fee preview", () => {

    const pricing = readSource("features/sell/ui/SellPricingBlock.tsx");

    expect(pricing).toContain('label="Price"');

    expect(pricing).not.toContain("Platform Fee");

    expect(pricing).not.toContain("You Receive");

    expect(pricing).not.toContain("calculatePlatformFee");

    expect(pricing).not.toContain("sell-pricing-summary");

  });



  it("photo rail uses native OS picker only — no custom source sheet", () => {

    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const picker = readSource("features/sell/ui/SellPhotoFileInput.tsx");

    expect(rail).toContain("Add Photos");

    expect(rail).toContain("SellPhotoFileInput");
    expect(picker).toContain('accept="image/*"');
    expect(picker).not.toContain('capture=');

    expect(rail).not.toContain("sourceSheetOpen");

    expect(rail).not.toContain('variant="sheet"');

    expect(rail).not.toContain("Take Photo");

    expect(rail).toContain("DeletePhotoAction");

    expect(rail).not.toContain("window.confirm");

    expect(rail).toContain("Replace");

    expect(rail).toContain("replacePhoto");

  });



  it("attribute pickers auto-close — no Done button", () => {

    const picker = readSource("features/sell/ui/SellOptionPicker.tsx");

    expect(picker).not.toContain(">Done</");

    expect(picker).toContain("onClose()");

    expect(picker).toContain("overflow-y-auto");

  });



  it("parcel block only — no shipping toggles", () => {

    const parcel = readSource("features/sell/ui/SellParcelBlock.tsx");

    expect(parcel).toContain("Parcel Size");

    expect(parcel).not.toContain("Home delivery");

    expect(parcel).not.toContain("Collection");

    expect(parcel).not.toContain("SellToggle");

  });



  it("deterministic prefill wired in provider", () => {

    const provider = readSource("features/sell/context/SellProvider.tsx");

    expect(provider).toContain("buildDeterministicPrefill");

    expect(provider).toContain("detectColourFromImageFile");

    expect(provider).toContain("buildSmartDescription");

    expect(provider).toContain("freshSession");

    expect(provider).toContain("runPublishPipeline");

    expect(provider).toContain("DRAFT_AUTOSAVE_MS");

    expect(provider).toContain("getFirstSellValidationIssue");

    expect(provider).not.toContain('setView("published")');

  });



  it("publish bar shows phase labels during publish", () => {

    const bar = readSource("features/sell/ui/SellPublishBar.tsx");

    expect(bar).toContain("publishPhaseLabel");

    expect(bar).toContain("sell-publish-bar fixed");

    expect(bar).toContain("isSellListingPublishable");

  });



  it("condition block uses canonical quick conditions without For Parts", () => {
    const block = readSource("features/sell/ui/SellConditionBlock.tsx");
    const options = readSource("lib/sell/sell-condition-options.ts");

    expect(block).toContain("SELL_QUICK_CONDITIONS");
    expect(options).toContain('"Very Good"');
    expect(options).toMatch(/"New",\s*\n\s*"Like New",\s*\n\s*"Very Good",\s*\n\s*"Good",\s*\n\s*"Fair"/);
    expect(options).not.toMatch(/"For Parts",/);
  });

  it("suggested attributes remain editable after completion", () => {
    const attrs = readSource("features/sell/ui/SellProgressiveAttributes.tsx");
    expect(attrs).toContain("userModifiedFields");
    expect(attrs).toContain("setActiveId(def.id)");
    expect(attrs).not.toContain("if (!completed) setActiveId");
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

