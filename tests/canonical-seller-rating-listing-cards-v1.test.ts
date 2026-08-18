import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  applyCanonicalSellerRatingsToProducts,
  CANONICAL_SELLER_RATING_SOURCE,
  collectSellerIdsForRatingBind,
  mapSellerProfileRowsToRatings,
} from "@/lib/products/canonical-seller-rating-v1";
import { formatCardRating } from "@/lib/listing-card/format";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function card(id: string, sellerId: string, rating: number, reviewCount: number) {
  return { id, sellerId, rating, reviewCount };
}

describe("canonical seller rating listing-card bind", () => {
  it("locks seller_profiles as the only listing-card rating source", () => {
    expect(CANONICAL_SELLER_RATING_SOURCE).toBe("seller_profiles");
  });

  it("same seller + multiple listings → identical seller rating on every card", () => {
    const ratings = mapSellerProfileRowsToRatings([
      { id: "seller-a", rating: 5.0, review_count: 1 },
    ]);
    const bound = applyCanonicalSellerRatingsToProducts(
      [
        card("listing-a", "seller-a", 0, 0),
        card("listing-b", "seller-a", 4.2, 99),
        card("listing-c", "seller-a", 1, 3),
      ],
      ratings,
    );

    expect(bound.map((item) => item.rating)).toEqual([5, 5, 5]);
    expect(bound.map((item) => item.reviewCount)).toEqual([1, 1, 1]);
    expect(bound.map((item) => formatCardRating(item))).toEqual(["5.0", "5.0", "5.0"]);
  });

  it("canonical seller rating change propagates to every card of that seller", () => {
    const listings = [
      card("listing-a", "seller-a", 0, 0),
      card("listing-b", "seller-a", 0, 0),
      card("listing-c", "seller-a", 0, 0),
    ];

    const first = applyCanonicalSellerRatingsToProducts(
      listings,
      mapSellerProfileRowsToRatings([{ id: "seller-a", rating: 5.0, review_count: 1 }]),
    );
    expect(first.map((item) => formatCardRating(item))).toEqual(["5.0", "5.0", "5.0"]);

    const second = applyCanonicalSellerRatingsToProducts(
      listings,
      mapSellerProfileRowsToRatings([{ id: "seller-a", rating: 4.8, review_count: 2 }]),
    );
    expect(second.map((item) => item.rating)).toEqual([4.8, 4.8, 4.8]);
    expect(second.map((item) => item.reviewCount)).toEqual([2, 2, 2]);
    expect(second.map((item) => formatCardRating(item))).toEqual(["4.8", "4.8", "4.8"]);
    expect(second.some((item) => item.rating === 5)).toBe(false);
  });

  it("Seller B cards use Seller B rating, never Seller A", () => {
    const ratings = mapSellerProfileRowsToRatings([
      { id: "seller-a", rating: 5.0, review_count: 1 },
      { id: "seller-b", rating: 4.5, review_count: 10 },
    ]);
    const bound = applyCanonicalSellerRatingsToProducts(
      [
        card("a1", "seller-a", 0, 0),
        card("a2", "seller-a", 3.1, 8),
        card("b1", "seller-b", 5, 1),
        card("b2", "seller-b", 0, 0),
      ],
      ratings,
    );

    expect(bound.filter((item) => item.sellerId === "seller-a").map((item) => item.rating)).toEqual([
      5, 5,
    ]);
    expect(bound.filter((item) => item.sellerId === "seller-b").map((item) => item.rating)).toEqual([
      4.5, 4.5,
    ]);
    expect(formatCardRating(bound[2])).toBe("4.5");
  });

  it("never keeps products.rating when a seller profile row exists", () => {
    const bound = applyCanonicalSellerRatingsToProducts(
      [card("listing-a", "seller-a", 0, 12)],
      mapSellerProfileRowsToRatings([{ id: "seller-a", rating: 4.8, review_count: 2 }]),
    );
    expect(bound[0].rating).toBe(4.8);
    expect(bound[0].reviewCount).toBe(2);
    expect(bound[0].rating).not.toBe(0);
  });

  it("collects unique seller ids for one batch bind", () => {
    expect(
      collectSellerIdsForRatingBind([
        { sellerId: "seller-a" },
        { sellerId: "seller-a" },
        { sellerId: "seller-b" },
        { sellerId: "  " },
        { sellerId: null },
      ]),
    ).toEqual(["seller-a", "seller-b"]);
  });

  it("wires homepage, browse/search, saved, recently viewed, and store sold cards", () => {
    const homepage = readSource("lib/products/repository.ts");
    const listings = readSource("lib/listings/repository.ts");
    const saved = readSource("lib/saved/store.ts");
    const recent = readSource("lib/launch/recently-viewed.ts");
    const store = readSource("lib/store/store-repository.ts");
    const following = readSource("lib/following-feed/store.ts");
    const helper = readSource("lib/products/canonical-seller-rating-v1.ts");

    expect(helper).toContain("seller_profiles");
    expect(helper).not.toContain("calculateSeller");
    expect(homepage).toContain("enrichProductsWithCanonicalSellerRating");
    expect(homepage).toContain("getHomepageFeed");
    expect(listings).toContain("enrichProductsWithCanonicalSellerRating");
    expect(listings).toContain("sellerId: row.seller_id");
    expect(saved).toContain("enrichProductsWithCanonicalSellerRating");
    expect(recent).toContain("enrichProductsWithCanonicalSellerRating");
    expect(store).toContain("applyCanonicalSellerRatingsToProducts");
    expect(following).toContain("getEligibleListings");
  });
});
