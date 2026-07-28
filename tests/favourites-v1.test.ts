import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIVE_EMPTY_STATE } from "@/lib/saved/saved-live-production-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Favourites / Saved — LIVE production lock", () => {
  it("keeps existing /saved route and SavedItemsV1", () => {
    const page = readSource("app/saved/page.tsx");
    expect(page).toContain("SavedItemsV1");
    expect(page).toContain("fetchSavedItems");
    expect(page).toContain("initialItems");
  });

  it("uses Saved title, Homepage ListingCard, and LIVE empty state", () => {
    const page = readSource("features/account-module/components/SavedItemsV1.tsx");

    expect(page).toContain('title="Saved"');
    expect(page).toContain("showHeaderTitle");
    expect(page).toContain("LISTING_CARD_HOMEPAGE_PROPS");
    expect(page).toContain("ListingCard");
    expect(page).toContain('favoriteMode="controlled"');
    expect(page).toContain("rx-listing-grid");
    expect(page).toContain(LIVE_EMPTY_STATE.title);
    expect(page).toContain(LIVE_EMPTY_STATE.cta);
    expect(page).toContain(`href="${LIVE_EMPTY_STATE.ctaHref}"`);
  });

  it("uses LIVE per-card hook — FavouriteStore deleted — no SSOT bus", () => {
    const page = readSource("features/account-module/components/SavedItemsV1.tsx");
    const hook = readSource("features/home/hooks/use-product-watchlist.ts");

    expect(existsSync(join(process.cwd(), "lib/favourites/favourite-store.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "components/saved/SavedHeartButton.tsx"))).toBe(false);
    expect(page).toContain("setItems(payload.items)");
    expect(page).not.toContain("favouriteStore");
    expect(page).not.toContain("mergeSavedItems");
    expect(page).not.toContain("useSavedSsotItems");
    expect(hook).toContain("setIsSaved(nextSaved)");
    expect(hook).not.toContain("useSavedSSOT");
  });

  it("does not create duplicate listing card implementations", () => {
    const page = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(page).not.toContain("ListingCardV2");
    expect(page).not.toContain("FavouritesCard");
    expect(page).not.toContain("SavedCard");
  });
});
