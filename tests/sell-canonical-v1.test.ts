import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SELL_PAGE_CANONICAL_VERSION, SELL_PAGE_FREEZE } from "@/features/sell/ui/SellPage";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell page Absolute Authority v1.0", () => {
  it("exports frozen canonical version marker", () => {
    expect(SELL_PAGE_CANONICAL_VERSION).toBe("v1.0.1-final-frozen");
    expect(SELL_PAGE_FREEZE).toBe("FROZEN");
  });

  it("has one canonical SellPage with Account DS + Owner field order", () => {
    const page = readSource("features/sell/ui/SellPage.tsx");
    const route = readSource("app/(platform)/sell/page.tsx");

    expect(route).toContain("SellPage");
    expect(route).not.toContain("SellScreen");
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("sellPageTitle");
    expect(page).toContain("CREATE");
    expect(page).toContain("EDIT");
    expect(page).toContain("showHeaderTitle");
    expect(page).toContain("AccountPageStack");
    expect(page).toContain("SellPhotoRail");
    expect(page).toContain("SellTitleBlock");
    expect(page).toContain("SellDescriptionBlock");
    expect(page).toContain("SellCategoryBlock");
    expect(page).toContain("SellProgressiveAttributes");
    expect(page).not.toContain("SellConditionBlock");
    expect(page).toContain("SellPricingBlock");
    expect(page).toContain("SellParcelBlock");
    expect(page).toContain("SellPublishBar");
    expect(page).toContain("PublishSuccessDialog");
    expect(page).toContain("PublishingOverlay");
    expect(page).not.toContain("SellReviewBlock");
    expect(page).not.toContain("SellShippingBlock");
    expect(page).not.toContain("DraftRecoveryDialog");
    expect(() => readSource("components/sell/DraftRecoveryDialog.tsx")).toThrow();
    expect(() => readSource("features/sell/ui/SellReviewBlock.tsx")).toThrow();
    expect(() => readSource("features/sell/ui/SellConditionBlock.tsx")).toThrow();

    const loading = readSource("app/(platform)/sell/loading.tsx");
    expect(loading).toContain("BetaAppShell");
    expect(loading).toContain("SellSkeleton");

    // Owner order: Description → Category → Dynamic Attributes → Price → Parcel
    expect(page.indexOf("<SellDescriptionBlock")).toBeLessThan(page.indexOf("<SellCategoryBlock"));
    expect(page.indexOf("<SellCategoryBlock")).toBeLessThan(page.indexOf("<SellProgressiveAttributes"));
    expect(page.indexOf("<SellProgressiveAttributes")).toBeLessThan(page.indexOf("<SellPricingBlock"));
    expect(page.indexOf("<SellPricingBlock")).toBeLessThan(page.indexOf("<SellParcelBlock"));
  });

  it("photo rail tiles are 112×168 · 4:5 · radius 16 · gap 10", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const css = readSource("styles/rovexo/sell.css");
    expect(rail).toContain("h-[168px] w-[112px]");
    expect(rail).toContain("sell-photo-tile--uploaded");
    expect(rail).toContain("sell-photo-tile__delete");
    expect(rail).toContain("sell-photo-section__header");
    expect(rail).not.toContain("h-11 w-11 place-items-center rounded-ds-full bg-black/60");
    expect(css).toContain("--sell-photo-w: 112px");
    expect(css).toContain("--sell-photo-h: 168px");
    expect(css).toContain("--sell-photo-radius: 16px");
    expect(css).toContain("--sell-photo-gap: 10px");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("object-position: center center");
    expect(css).toContain(".sell-photo-tile__delete");
    expect(css).toContain("width: 22px");
    expect(css).toContain("top: 6px");
    expect(css).toContain("right: 6px");
    expect(css).toContain("rgba(0, 0, 0, 0.38)");
    expect(css).toContain("rgba(255, 255, 255, 0.18)");
    expect(css).toContain("border: 1px solid #ececec");
    expect(css).toContain("gap: var(--sell-photo-gap)");
  });

  it("category picker stays manual; suggestion lives above picker (confirm-only)", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    expect(picker).toContain("Search categories");
    expect(picker).toContain("CATEGORY_ENGINE_V1");
    expect(picker).not.toContain("Suggested");
    expect(picker).not.toContain("suggestCategoryFromTitle");
    expect(picker).not.toContain("detectCategoryFromTitle");
    expect(block).toContain("SellCategorySuggestionCard");
    expect(block).toContain("resolveLiveCategorySuggestion");
  });

  it("pricing block is price-only — no seller fee preview", () => {
    const pricing = readSource("features/sell/ui/SellPricingBlock.tsx");
    expect(pricing).toContain('label="Price"');
    expect(pricing).not.toContain("Platform Fee");
    expect(pricing).not.toContain("You Receive");
  });

  it("publish bar is inline below Parcel — CanonicalButton · not sticky viewport", () => {
    const bar = readSource("features/sell/ui/SellPublishBar.tsx");
    expect(bar).toContain('data-sell-publish-position="below-parcel"');
    expect(bar).toContain("CanonicalButton");
    expect(bar).toContain("isSellListingPublishable");
    expect(bar).not.toContain("account-settings-sticky-action");
    expect(bar).not.toContain("sell-publish-bar fixed");
  });

  it("primitives use Listing Attribute rows (Account CDS) — no Sell-only cards", () => {
    const primitives = readSource("features/sell/ui/SellPrimitives.tsx");
    // Owner Attribute Design System: ListingAttributeRow → cds-menu-row (same CDS as CanonicalMenuRow).
    expect(primitives).toContain("ListingAttributeRow");
    expect(primitives).not.toContain("SellRowsCard");
    expect(primitives).not.toContain("SellCompactRow");
  });

  it("removed parallel SellScreen entry", () => {
    expect(() => readSource("features/sell/ui/SellScreen.tsx")).toThrow();
  });
});
