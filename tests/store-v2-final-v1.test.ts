import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STORE_V2_CANONICAL,
  STORE_V2_CANONICAL_UI,
  STORE_V2_FORBIDDEN_PROFILE_UI,
  STORE_V2_STATUS,
  STORE_V2_UI,
  STORE_V2_VERSION,
} from "@/lib/store/store-v2-final-v1";
import { VISIT_STORE_FINAL_UI_LOCK_V1 } from "@/lib/store/visit-store-final-ui-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("STORE v2.0 FINAL — Visit Store only (Profile isolated)", () => {
  it("locks Owner freeze certificate PRODUCTION_FREEZE_ACTIVE", () => {
    expect(STORE_V2_VERSION).toBe("2.0");
    expect(STORE_V2_CANONICAL).toBe("store-v2.0-final");
    expect(STORE_V2_STATUS).toBe("PRODUCTION_FREEZE_ACTIVE");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.status).toBe("PRODUCTION_FREEZE_ACTIVE");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.freezeStatus).toBe("PRODUCTION_FREEZE_ACTIVE");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.freezeLocked).toBe(true);
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.freezeActive).toBe(true);
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.commit).toBe("BLOCKED");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.push).toBe("BLOCKED");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.deploy).toBe("BLOCKED");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.route).toBe("/store/[slug]");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.outsideFreeze.route).toBe("/user/[username]");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.header.standard).toBe("ROVEXO Header Standard v1.0");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.header.mustMatch).toBe("Orders");
    expect(VISIT_STORE_FINAL_UI_LOCK_V1.header.layout).toEqual(["back", "title:Store", "close"]);
    expect(STORE_V2_CANONICAL_UI).toBe("features/store/components/StoreVisitPageV2.tsx");
    expect(STORE_V2_FORBIDDEN_PROFILE_UI).toBe(
      "features/profile/components/ViewProfilePage.tsx",
    );
    expect(STORE_V2_UI.tabs).toEqual(["listings", "reviews"]);
    expect(STORE_V2_UI.listings.forbidden).toContain("Featured");
    expect(STORE_V2_UI.header.layout).toEqual(["back", "title:Store", "close"]);
  });

  it("wires /store to StoreVisitPageV2 only", () => {
    const route = readSource("app/(platform)/store/[slug]/page.tsx");
    expect(route).toContain("StoreVisitPageV2");
    expect(route).toContain("loadStoreVisitPayload");
    expect(route).not.toContain("ViewProfilePage");
    expect(route).not.toContain("ProStorePage");
  });

  it("ships Visit Store UI contracts on StoreVisitPageV2", () => {
    const page = readSource("features/store/components/StoreVisitPageV2.tsx");
    expect(page).toContain('data-store-canonical={STORE_V2_CANONICAL}');
    expect(page).toContain('data-store-freeze="PRODUCTION_FREEZE_ACTIVE"');
    expect(page).toContain('data-store-compact="v2"');
    expect(page).toContain('data-store-mobile-canonical="v2.0"');
    expect(page).toContain("AccountCanonicalHeader");
    expect(page).toContain('centeredTitle="Store"');
    expect(page).toContain('fallbackHref="/search"');
    expect(page).toContain("storeCta");
    expect(page).toContain('aria-label="Share store"');
    expect(page).toContain('aria-label="Report store"');
    expect(page).toContain("Check out this ROVEXO Store");
    expect(page).toContain("Store link copied");
    expect(page).toContain("navigator.share");
    expect(page).toContain("handleShare");
    expect(page).toContain("AbortError");
    expect(page).toContain("navigator.share({");
    expect(page).not.toContain("canShare");
    expect(page).toContain('data-store-share="v2"');
    expect(page).not.toContain("Unable to share store.");
    expect(page).toContain("sv2__hero-icons");
    expect(page).toContain("sv2__icon-btn");
    expect(page).toContain("ShareIcon");
    expect(page).toContain("followers");
    expect(page).toContain("following");
    expect(page).toContain('setTab("listings")');
    expect(page).toContain('setTab("reviews")');
    expect(page).toContain("StoreShopBundles");
    const bundles = readSource("features/store/components/StoreShopBundles.tsx");
    expect(bundles).toContain("ListingCard");
    expect(bundles).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(bundles).toContain("Load more");
    expect(page).toContain("sv2__review-product");
    expect(page).toContain("/listing/");
    expect(page).toContain("Verified Purchase");
    expect(page).not.toContain(">Share Store<");
    expect(page).not.toContain(">Report Store<");
    expect(page).not.toContain("View Profile");
    expect(page).not.toContain("sv2__sidebar");
    expect(page).not.toContain("sv2__business");
    expect(page).not.toContain("sv2__bio");
    expect(page).not.toContain('>Message<');
    expect(page).not.toContain("startConversation");
    expect(page).not.toContain("/api/messages");
    expect(page).not.toContain("Order Details");
    expect(page).not.toContain("Featured");
    expect(page).not.toContain("CanonicalPageHeader");
    expect(page).not.toContain("Filter button");
    expect(page).not.toContain('aria-label="Filter"');

    const header = readSource("features/account-canonical/header/AccountCanonicalHeader.tsx");
    expect(header).toContain("RovexoHeaderCloseButton");
    expect(header).toContain("data-rovexo-header-standard");

    const css = readSource("styles/rovexo/store-visit-v2.css");
    expect(css).toContain("padding: 16px 0 32px");
    expect(css).toContain(".sv2__hero-icons");
    expect(css).toContain("gap: 14px");
    expect(css).toContain("color: var(--sv2-purple)");
    expect(css).not.toContain("store-v2-header-title");
    expect(css).not.toContain("grid-template-columns: 48px minmax(0, 1fr) 48px");
    expect(css).not.toContain("sv2__sidebar");
    expect(css).not.toContain("sv2__stats");
  });

  it("does not put Store v2 markers into Profile ViewProfilePage", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(profile).not.toContain("store-v2.0-final");
    expect(profile).not.toContain("StoreVisitPageV2");
    expect(profile).not.toContain("sv2__");
    expect(profile).toContain('MY_PROFILE_VERSION = "v8.0"');
    expect(profile).toContain('aria-label="Profile menu"');
    expect(profile).toContain("About");
  });

  it("enriches reviews for Visit Store product thumbs", () => {
    const store = readSource("lib/reviews/store.ts");
    const types = readSource("lib/reviews/types.ts");
    expect(types).toContain("productSlug");
    expect(types).toContain("productImageUrl");
    expect(store).toContain("enrichSellerReviewsForStore");
    expect(store).toContain('order.status === "completed"');
  });
});
