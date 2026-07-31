import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_EDIT_LISTING_ENGINE_V1,
  editListingHref,
  sellPageTitle,
  sellPrimaryCtaLabel,
} from "@/lib/sell/canonical-edit-listing-engine-v1";
import { sellDraftFingerprint } from "@/lib/sell/sell-draft-fingerprint";
import { createEmptyDraft } from "@/features/sell/types";
import { publishPhaseLabel } from "@/lib/sell/publish-engine";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Canonical Edit Listing Engine v1.0", () => {
  it("locks one Sell form for CREATE and EDIT", () => {
    expect(CANONICAL_EDIT_LISTING_ENGINE_V1.equation).toBe("ONE_SELL_FORM = CREATE_MODE | EDIT_MODE");
    expect(CANONICAL_EDIT_LISTING_ENGINE_V1.canonicalComponent).toBe(
      "features/sell/ui/SellPage.tsx",
    );
    expect(CANONICAL_EDIT_LISTING_ENGINE_V1.forbidden).toEqual(
      expect.arrayContaining([
        "SECOND_EDIT_PAGE",
        "DUPLICATE_FORM",
        "CREATE_ON_SAVE_CHANGES",
      ]),
    );
    expect(sellPageTitle(false)).toBe("Create Listing");
    expect(sellPageTitle(true)).toBe("Edit Listing");
    expect(sellPrimaryCtaLabel(false)).toBe("Publish");
    expect(sellPrimaryCtaLabel(true)).toBe("Save Changes");
    expect(publishPhaseLabel("idle", { isEdit: true })).toBe("Save Changes");
    expect(editListingHref("abc")).toBe("/seller/listings/abc/edit");
  });

  it("edit route is a thin SellPage loader — not a second form", () => {
    const route = read("app/seller/listings/[id]/edit/page.tsx");
    expect(route).toContain("SellPage");
    expect(route).toContain("editListingId");
    expect(route).toContain("editListingSlug");
    expect(route).toContain("sellerListingToDraft");
    expect(route).not.toContain("EditListingForm");
    expect(route).not.toContain("EditListingPage");
  });

  it("Save Changes updates listing and returns to Listing Details", () => {
    const provider = read("features/sell/context/SellProvider.tsx");
    const engine = read("lib/sell/publish-engine.ts");
    expect(engine).toContain("PATCH");
    expect(engine).toContain("`/api/listings/${editListingId}`");
    expect(provider).toContain("editListingId");
    expect(provider).toContain("?updated=1");
    expect(provider).toContain("getListingCanonicalPath");
  });

  it("prefill restores parcel size from listing", () => {
    const mapper = read("lib/listings/draft-mapper.ts");
    const repo = read("lib/listings/repository.ts");
    expect(mapper).toContain("parcelSize: listing.parcelSize");
    expect(repo).toContain("parcel_size");
    expect(repo).toContain("parcelSize:");
  });

  it("unsaved changes dialog exists on SellPage", () => {
    const page = read("features/sell/ui/SellPage.tsx");
    expect(page).toContain("Unsaved Changes");
    expect(page).toContain("Leave without saving?");
    expect(page).toContain("beforeunload");
    expect(page).toContain("getIsDirty");
  });

  it("seller menu has Edit/Sold/Pause/Relist/Delete; buyer has Report/Block/Share", () => {
    const menu = read("features/product-detail/ProductListingActionsMenu.tsx");
    expect(menu).toContain("Edit Listing");
    expect(menu).toContain("Mark as Sold");
    expect(menu).toContain("Pause Listing");
    expect(menu).toContain("Relist");
    expect(menu).toContain("Delete Listing");
    expect(menu).toContain("Report Listing");
    expect(menu).toContain("Report Seller");
    expect(menu).toContain("Block Seller");
    expect(menu).toContain("Share");
    expect(menu).toContain('data-listing-actions-menu={isOwner ? "seller" : "buyer"}');
    expect(CANONICAL_EDIT_LISTING_ENGINE_V1.forbiddenSellerMenuActions).toContain(
      "report_listing",
    );
  });

  it("fingerprint detects draft changes", () => {
    const base = createEmptyDraft();
    const a = sellDraftFingerprint(base);
    const b = sellDraftFingerprint({ ...base, title: "Changed" });
    expect(a).not.toBe(b);
  });
});
