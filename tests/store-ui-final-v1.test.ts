import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STORE_VISIT_LISTING_PROPS } from "@/lib/store/store-listing-card-premium-v1";
import { formatListingPrice, formatListingPriceIncl } from "@/lib/listing-card/format";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Store UI final — Visit Store only", () => {
  it("has zero Store Cover UI, controls, helpers, or reserved banner space", () => {
    expect(existsSync(join(process.cwd(), "features/store/components/StoreCoverControls.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), "lib/store/store-cover-v1.ts"))).toBe(false);

    const page = readSource("features/store/components/StoreVisitPageV2.tsx");
    const css = readSource("styles/rovexo/store-visit-v2.css");
    const checklist = readSource("features/seller/components/SellerSetupChecklist.tsx");

    expect(page).not.toContain("StoreCoverControls");
    expect(page).not.toContain("store-cover");
    expect(page).not.toContain("hasPersistedStoreCover");
    expect(page).not.toContain("sv2__banner");
    expect(page).not.toContain("Add cover");
    expect(page).not.toContain("Change cover");
    expect(page).not.toContain("Remove cover");
    expect(page).not.toContain("data-store-hero-banner");
    expect(page).not.toContain("data-store-cover");
    expect(page).not.toContain("/api/profile/cover");
    expect(page).toContain('data-store-hero="v2"');
    expect(page).toContain("sv2__avatar");

    expect(css).not.toContain(".sv2__banner");
    expect(css).not.toContain("sv2__cover");
    expect(css).not.toContain("data-store-cover");
    expect(css).not.toContain("cover-guidance");
    expect(css).toContain(".sv2__hero");
    expect(css).toMatch(/\.sv2__hero\s*\{[^}]*margin-top:\s*0/);

    expect(checklist).not.toContain("Business cover");
    expect(checklist).not.toContain("hasCover");
    expect(checklist).not.toContain("Upload a store banner");
  });

  it("Visit Store listing cards use seller-set price only", () => {
    expect(STORE_VISIT_LISTING_PROPS.surface).toBe("store");
    expect(STORE_VISIT_LISTING_PROPS.showBuyerProtection).toBe(false);
    expect(formatListingPrice(12.99)).toBe("£12.99");
    expect(formatListingPriceIncl(12.99)).toContain("incl.");

    const bundles = readSource("features/store/components/StoreShopBundles.tsx");
    expect(bundles).toContain("STORE_VISIT_LISTING_PROPS");
    expect(bundles).not.toContain("HP_CANONICAL_LISTING_PROPS");
    expect(bundles).not.toContain("formatListingPriceIncl");

    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain('surface === "store"');
    expect(card).toContain("showIncl");
    expect(card).toContain("♡");
    expect(card).toContain("product.likes");
    expect(card).toContain("saveStore");
    expect(card).toContain("isStoreCard ? null");
    expect(card).toContain("👁");
  });

  it("keeps homepage incl. / shield on non-store surfaces", () => {
    const defaults = readSource("lib/listing-card/defaults.ts");
    expect(defaults).toContain("showBuyerProtection: true");
    expect(defaults).toContain('surface: "homepage"');
    const home = readSource("components/ui/ListingCard.tsx");
    expect(home).toContain("inclTotalHomepage");
    expect(home).toContain("ShieldLineIcon");
    expect(home).toContain("EyeLineIcon");
  });

  it("wires Follow / Message / Share without a second store engine", () => {
    const page = readSource("features/store/components/StoreVisitPageV2.tsx");
    expect(page).toContain("FollowButton");
    expect(page).toContain("handleMessage");
    expect(page).toContain("handleShare");
    expect(page).toContain("data-store-header-overflow");
    expect(page).toContain("PLATFORM_EMOJI.more");
    expect(page).toContain("StoreVisitPageV2");
    expect(page).not.toContain("StoreVisitPageV3");
    expect(page).not.toContain("business_review");
  });

  it("does not restore Store Cover after Owner REMOVE", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(profile).not.toContain("updateCoverUrl");
    expect(profile).not.toContain("StoreCoverControls");
  });

  it("opens a real owner overflow menu without Report", () => {
    const page = readSource("features/store/components/StoreVisitPageV2.tsx");
    expect(page).toContain('data-store-overflow-role={isOwnStore ? "owner" : "visitor"}');
    expect(page).toContain('data-store-overflow-owner="share"');
    expect(page).toContain('data-store-overflow-owner="edit"');
    expect(page).toContain('data-store-overflow-visitor="report"');
    expect(page).toContain("Share Store");
    expect(page).toContain("Edit Store");
    expect(page).toContain('router.push("/account/edit-profile")');
    expect(page).toContain("handleShare");
    expect(page).toContain('overflowOpen && "sv2--overflow-open"');
    expect(page).toContain("ignoreOverflowBackdropClickRef");
    expect(page).not.toContain("if (isOwnStore) return");
  });
});
