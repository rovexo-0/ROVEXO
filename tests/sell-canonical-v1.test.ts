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

  it("has one canonical sell screen without legacy blocks", () => {
    const screen = readSource("features/sell/ui/SellScreen.tsx");
    expect(screen).toContain('data-sell-canonical={SELL_PAGE_CANONICAL_VERSION}');
    expect(screen).toContain("SellPhotoRail");
    expect(screen).toContain("SellTitleBlock");
    expect(screen).toContain("SellCategoryBlock");
    expect(screen).toContain("SellAttributesBlock");
    expect(screen).toContain("SellPricingBlock");
    expect(screen).toContain("SellShippingBlock");
    expect(screen).toContain("SellPublishBar");
    expect(screen).not.toContain("SellOptionsBlock");
    expect(screen).not.toContain("SellConditionBlock");
    expect(screen).not.toContain("SellSuccessScreen");
  });

  it("category picker has suggestions only — no search", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    expect(picker).toContain("detectCategoryFromTitle");
    expect(picker).toContain("SUGGEST_CONFIDENCE_MIN");
    expect(picker).toContain("Suggested");
    expect(picker).toContain("All categories");
    expect(picker).not.toContain("Search categories");
    expect(picker).not.toContain("searchCategoryPicker");
  });

  it("publish bar uses Publish Listing label", () => {
    const bar = readSource("features/sell/ui/SellPublishBar.tsx");
    expect(bar).toContain("Publish Listing");
    expect(bar).not.toContain("Continue");
    expect(bar).not.toContain("Publishing…");
  });

  it("photo rail uses Add Photos and native gallery", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("Add Photos");
    expect(rail).toContain('intent="gallery"');
    expect(rail).not.toContain("uploadProgress");
    expect(rail).not.toContain("Uploading photos");
  });

  it("attributes block includes condition from attribute engine", () => {
    const attrs = readSource("features/sell/ui/SellAttributesBlock.tsx");
    expect(attrs).not.toContain('def.id !== "condition"');
    expect(attrs).toContain("getAttributeDefsForCategory");
  });

  it("shipping block has parcel size, home delivery, collection — no free postage", () => {
    const shipping = readSource("features/sell/ui/SellShippingBlock.tsx");
    expect(shipping).toContain("Parcel size");
    expect(shipping).toContain("Home delivery");
    expect(shipping).toContain("Collection");
    expect(shipping).toContain("Buyer pays shipping");
    expect(shipping).not.toContain("Free postage");
  });

  it("publish redirects immediately — no success screen view", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("router.push(`/listing/${slug}`)");
    expect(provider).not.toContain('setView("published")');
  });

  it("removed legacy duplicate sell components", () => {
    const legacyPaths = [
      "features/sell/components/PhotoUploader.tsx",
      "features/sell/components/CategoryTreePicker.tsx",
      "features/sell/ui/SellOptionsBlock.tsx",
      "features/sell/ui/SellConditionBlock.tsx",
      "features/sell/ui/SellSuccessScreen.tsx",
    ];
    for (const legacyPath of legacyPaths) {
      expect(() => readSource(legacyPath)).toThrow();
    }
  });

  it("/sell/new redirects to canonical /sell", () => {
    const page = readSource("app/sell/new/page.tsx");
    expect(page).toContain('redirect("/sell")');
  });
});
