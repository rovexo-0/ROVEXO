import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STORE_LISTING_CARD_IMAGE_LOCK,
  STORE_LISTING_CARD_SPACING,
  STORE_LISTING_CARD_STATUS,
  STORE_LISTING_CARD_TOKENS,
  STORE_LISTING_CARD_VERSION,
} from "@/lib/store/store-listing-card-premium-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Store Card Premium Freeze", () => {
  it("locks CEO-approved image and card tokens", () => {
    expect(STORE_LISTING_CARD_VERSION).toBe("1.0");
    expect(STORE_LISTING_CARD_STATUS).toContain("COMPACT_PREMIUM_FREEZE");
    expect(STORE_LISTING_CARD_TOKENS.store).toEqual({
      imageWidth: 88,
      imageHeight: 128,
      cardMinHeight: 240,
      imagePadding: 8,
      gap: 8,
      imageRadius: 16,
    });
    expect(STORE_LISTING_CARD_TOKENS.visit).toEqual({
      imageWidth: 96,
      imageHeight: 136,
      cardMinHeight: 250,
      imagePadding: 8,
      gap: 8,
      imageRadius: 16,
    });
    expect(STORE_LISTING_CARD_TOKENS.business).toEqual(STORE_LISTING_CARD_TOKENS.visit);
    expect(STORE_LISTING_CARD_SPACING).toEqual({
      imageToPrice: 8,
      priceToTitle: 6,
      titleToCondition: 4,
      conditionToRating: 4,
    });
    expect(STORE_LISTING_CARD_IMAGE_LOCK).toMatchObject({
      objectFit: "cover",
      objectPosition: "center",
      overflow: "hidden",
      borderRadius: 16,
    });
  });

  it("scopes CSS to store surfaces only (cover/center, no contain)", () => {
    const css = readSource("styles/rovexo/store-listing-card-premium-v1.css");
    expect(css).toContain('data-store-listing-cards="store"');
    expect(css).toContain('data-store-listing-cards="visit"');
    expect(css).toContain('data-store-listing-cards="business"');
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("object-position: center");
    expect(css).not.toContain("object-fit: contain");
    expect(css).not.toContain("object-position: left");
    expect(css).not.toContain("object-position: right");
    expect(css).toContain("88px");
    expect(css).toContain("128px");
    expect(css).toContain("96px");
    expect(css).toContain("136px");
    expect(css).toContain("240px");
    expect(css).toContain("250px");
  });

  it("wires Store / Visit Store / Business Store without forking ListingCard", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    const proStore = readSource("features/store/components/ProStorePage.tsx");
    expect(profile).toContain("storeListingCardAttr");
    expect(profile).toContain('isOwnProfile ? "store" : "visit"');
    expect(profile).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(proStore).toContain('storeListingCardAttr("business")');
    expect(proStore).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(proStore).not.toContain("ListingCardV2");
  });

  it("does not alter Homepage ListingCard module freeze tokens", () => {
    const homeCss = readSource("components/ui/ListingCard.module.css");
    expect(homeCss).toContain("rootHomepage");
    expect(homeCss).toContain("aspect-ratio: 173 / 268");
    expect(homeCss).not.toContain("data-store-listing-cards");
  });
});
